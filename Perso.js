/*jslint esnext:true,browser:true,evil:true*/
class Perso {
	constructor() {
		this.variables = {};
		this.setEvt();
	}
	init() {
		this.applyStorageData();
		this.manageFormulas();
		this.manageClicks();
		this.data = this.getData();
	}
	manageFormulas() {
		var elements;
		elements = document.querySelectorAll("*[data-formula]");
		elements.forEach(function (e) {
			var formula, val;
			formula = e.getAttribute("data-formula");
			formula = this.parseFormula(formula);
//			console.log(i, variables, formula);
			val = eval(formula);
			e.setAttribute("data-value", val);
//			if (i === 12) debugger;
			if (e.hasAttribute("value")) {
				e.setAttribute("value", val);
			} else if (e.value !== undefined) {
				e.value = val;
			} else {
				e.innerHTML = val;
			}
//			debugger;
		}, this);
	}
	manageClicks() {
		var elements;
		elements = document.querySelectorAll("*.clickrandom");
		elements.forEach(function (e) {
			e.addEventListener('click', this.evt.clickrandom.click);
		}, this);
		elements = document.querySelectorAll("*.clickdice");
		elements.forEach(function (e) {
			e.addEventListener('click', this.evt.clickdice.click);
		}, this);
	}
	getVariables(formula) {
		var result, variables;
		variables = this.getVariableNames(formula);
		result = this.getValues(variables);
		return result;
	}
	getVariableNames(formula) {
		var result;
		result = formula.match(/[a-zA-Z_]+(?:\.[a-zA-Z_]+)*/g);
		return result || [formula];
	}
	replaceVariables(formula, variables) {
		var variableName, expression, value;
		if (variables instanceof Array) {
			for (let i = 0, n = variables.length; i < n; i += 1) {
				variableName = variables[i];
				expression = new RegExp(variableName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "g");
				value = variables[variableName];
				formula = formula.replace(expression, value);
			}
		} else {
			for (variableName in variables) {
				expression = new RegExp(variableName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "g");
				value = variables[variableName];
				formula = formula.replace(expression, value);
			}
		}
		return formula;
	}
	parseDice(dice, rtnEval) {
		var die;
		if (die = dice.match(/([0-9]*)[d|D]([0-9]+)/), die) {
			let val = this.draw(die[2], die[1]);
			dice = dice.replace(die[0], val);
		}
		dice = this.parseFormula(dice);
		console.log(dice);
		if (rtnEval === 0) {
			return dice;
		} else if (rtnEval === 1) {
			return eval(dice);
		} else {
			return dice + "=" + eval(dice);
		}
	}
	draw(die, nb, bonus) {
		var result, i;
		bonus = bonus || 0;
		nb = nb || 1;
		result = 0;
		for (i = 0; i < nb; i += 1) {
			result += Math.floor(Math.random() * die) + 1;
		}
		return result + bonus;
	}
	parseFormula(formula) {
		var result, k, touched, oldResult, variables;
		variables = this.getVariables(formula); //ATTENTION! Ne fonctionns pas vorrectement
		formula = this.replaceVariables(formula, variables);
		result = formula;
		do {
			touched = false;
			oldResult = result;
			for (k in Perso.remplacements) {
				result = this.replaceFormula(result, k, Perso.remplacements[k]);
				if (oldResult !== result) {
					touched = true;
				}
			}
		} while (touched);
		return result;
	}
	replaceFormula(formula, expression, remplacement) {
		return formula.replace(new RegExp(expression, "g"), remplacement);
	}
	getValues(variableNames) {
		var result;
		result = {};
		variableNames.forEach(function (variableName) {
			if (this.variables[variableName] === undefined) {
				this.variables[variableName] = this.findValue(variableName);
			}
			result[variableName] = this.variables[variableName];
		}, this);
		return result;
	}
	findValue(element) {
		if (!element) {
			return 0;
		} else if (typeof element === "number") {
			return element;
		} else if (typeof element === "string") {
			let e, parts, cls;
			if (e = parseFloat(element), !isNaN(e)) {
				return e;
			} else if (e = document.getElementById(element), e) {
				return this.findValue(e);
			} else {
				parts = element.split(".");
//				debugger;
				e = document.getElementById(parts.shift());
				while (cls = parts.shift(), cls) {
					e = e.querySelector("*." + cls);
				}
				return this.findValue(e);
			}
		} else if (element instanceof HTMLElement) {
			if (element.hasAttribute("data-value")) {
				return this.findValue(element.getAttribute("data-value"));
			} else if (element.type === "checkbox") {
				if (!element.checked) {
					return 0;
				} else if (element.hasAttribute("value")) {
					return this.findValue(element.getAttribute("value"));
				} else {
					return 1;
				}
			} else if (element.hasAttribute("value")) {
				return this.findValue(element.getAttribute("value"));
			} else if (element.value !== undefined) {
				return this.findValue(element.value);
			} else {
				return this.findValue(element.innerHTML);
			}
		} else if (typeof element === "object") {
			return this.findValue(element.valeur);
		}
	}
	setEvt() {
		var perso = this;
		this.evt = {
			clickrandom: {
				click: function () {
					if (this.hasAttribute("data-path")) {
						let ptr = this;
						let parts = this.getAttribute("data-path").split("/");
						while(parts[0] == "..") {
							ptr = ptr.parentNode;
							parts.shift();
						}
						parts = parts.join("/");
						ptr = ptr.querySelector(parts);
						let val = perso.findValue(ptr);
						let r = Math.floor(Math.random() * 20);
						var out = r+" + "+val+" = "+(r + val);
						this.parentNode.insertBefore(perso.diceResult(out), this);
					}
				}
			},
			clickdice: {
				click: function () {
					var val;
					if (this.hasAttribute("data-dice")) {
						val = this.getAttribute("data-dice");
					} else {
						val = this.textContent;
					}
					val = perso.parseDice(val);
					this.parentNode.insertBefore(perso.diceResult(val), this);
				}
			}
		};
	}
	diceResult(val) {
		var result;
		result = document.createElement("span");
		result.classList.add("diceresult");
		result.innerHTML = val;
		result.addEventListener("click", function () {
			this.parentNode.removeChild(this);
		});
		return result;
	}
	applyStorageData() {
		var data;
		this.data = this.getData();
		if (!window.localStorage.torann) {
			window.localStorage.torann = JSON.stringify(this.data);
			return this;
		}
		data = JSON.parse(window.localStorage.torann);
		for (var k in data) {
			this.data[k] = data[k];
		}
		var copy = JSON.parse(JSON.stringify(this.data));
		var elements = this.getDataDom();
		elements.forEach(function (e) {
			var id = e.id;
			if (copy[id] !== undefined) {
				e.setAttribute("value", this.data[id]);
				delete copy[id];
			}
		}, this);
		for (k in copy) {
			delete this.data[k];
		}
//		for (var k in this.data) {
//			let e = document.getElementById(k);
//			if (!e) {
//				delete this.data[k];
//			} else {
//				let type = e.getAttribute("type");
//				if (type === "radio") {
//					throw "traiter les radios";
//				} else if (type === "checkbox") {
//					throw "traiter les checkbox";
//				} else if (e.hasAttribute("value")) {
//					e.setAttribute("value", this.data[k]);
//				}
//			}
//		}
	}
	setStorage() {
		var elements = this.getDataDom();
		elements.forEach(function (e) {
			e.addEventListener("blur", Perso.evt.input.blur);
			e.obj = this;
		}, this);
	}
	getData() {
		var elements = this.getDataDom();
		var result = {};
		elements.forEach(function (e) {
			result[e.id] = e.value;
			let type = e.getAttribute("type");
			if ((type === "radio" || type === "checkbox") && e.checked === false) {
				result[e.id] = "!"+result[e.id];
			}
		});
		return result;
	}
	getDataDom() {
		var elements = document.querySelectorAll("input[id]");
		return elements;
	}
	static uncollapseElement(element, state) {
		var id = element.getAttribute("id");
		if (state === undefined) {
			state = !this.uncollapsed[id];
		}
		if (state) {
			this.uncollapsed[id] = true;
			element.classList.remove("collapse");
		} else {
			delete this.uncollapsed[id];
			element.classList.add("collapse");
		}
		window.localStorage.uncollapsed = JSON.stringify(this.uncollapsed);
		return state;
	}
	static uncollapseChildren(parentNode, state) {
		let elements = parentNode.querySelectorAll(this.collapsibleSelector);
		elements.forEach((element)=>this.uncollapseElement(element.parentNode, state));
	}
	static initCollapse() {
		var elements = document.querySelectorAll(this.collapsibleSelector);
		elements.forEach(function (e) {
			var id = e.parentNode.getAttribute("id");
			e.addEventListener("click", this.evt.collapsible.click);
			if (!this.uncollapsed[id]) {
				e.parentNode.classList.add("collapse");
			}
		}, this);
	}
	static getSave(element) {
		var id = element.getAttribute("id");
		debugger;
	}
	static setSave(element, value) {
		var id = element.getAttribute("id");
		var original = this.data[id];
		debugger;
		switch (element.type) {
			case "radio": case "checkbox":

			break;
			case "TEXTAREA":

			break;
			default:
		}
		debugger;
	}
	static initSave() {
		var elements = document.querySelectorAll("*.save");
		elements.forEach(function (e) {
			e.addEventListener("click", this.evt.save.blur);
		}, this);
	}
	static addSummary() {
		var resultat = this.createSummary();
		document.getElementById("summary").appendChild(resultat);
	}
	static createSummary() {
		var resultat;
		resultat = document.createElement("ul");
		var headers = document.querySelectorAll("article[id]:not([id=summary])>header");
		headers.forEach(function (header) {
			let li = resultat.appendChild(document.createElement("li"));
			let a = li.appendChild(document.createElement("a"));
			a.setAttribute("href", "#" + header.parentElement.getAttribute("id"));
			a.innerHTML = header.textContent;
		});
		return resultat;
	}
	static init() {
		this.uncollapsed = {};
		if (window.localStorage.uncollapsed) {
			this.uncollapsed = JSON.parse(window.localStorage.uncollapsed);
		} else {
			window.localStorage.uncollapsed = JSON.stringify(this.uncollapsed);
		}
		this.data = {};
		if (window.localStorage.data) {
			this.data = JSON.parse(window.localStorage.data);
		} else {
			window.localStorage.data = JSON.stringify(this.data);
		}
		this.collapsibleSelector = "[id]>h1,[id]>h2,[id]>h3,article>header";
		this.symbols = {
			"002B":"+",
			"2212":"−",
			"00D7":"×",
			"00F7":"÷",
			"2308":"⌉", "2309":"⌈", //ceil
			"230A":"⌊", "230B":"⌋", //floor
			"27E6":"⟦", "27E7":"⟧" //round
		};
		this.evt = {
			input: {
				blur: function () {
					debugger;
					//this.obj.getData();
				}
			},
			collapsible: {
				click: function (e) {
					var state = Perso.uncollapseElement(this.parentNode);
					if (e.altKey) {
						Perso.uncollapseChildren(this.parentNode, state);
					}
				}
			},
			save: {
				blur: function () {
					Perso.setSave(this);
				}
			}
		};
		this.remplacements = {
			"⌊([^⌊⌋]+)⌋":"Math.floor($1)",
			"⌈([^⌈⌉]+)⌉":"Math.ceil($1)",
			"⟦([^⟦⟧]+)⟧":"Math.round($1)"
		};
		window.addEventListener("load", function () {
			var perso = new Perso();
			perso.init();
			Perso.initCollapse();
			Perso.initSave();
			Perso.addSummary();
		});
	}
}
Perso.init();
