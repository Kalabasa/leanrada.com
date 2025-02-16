$(function(){

var btnGo = $("#btn_go");
var btnBack = $("#btn_back");
var buttons = $(btnGo).add(btnBack);
buttons.children().hide();

var btnGoB = btnGo.children();
var btnBackB = btnBack.children();

$(".part").hide();
var partNum = $("#part_num");
var partTypes = $("#part_types");
var partFunc = $("#part_func");
var partTable = $("#part_table");

//------------------------------------------------------------------------------
//	Starter
//------------------------------------------------------------------------------

var btnStart = $("#btn_start");
btnStart.delay(100).fadeIn(1000);
btnStart.focus();
btnStart.attr("tabindex", 1);
btnStart.on("click", function(){
	btnStart.off("click");
	$("#starter").slideUp();
	
	partNum.delay(500).slideDown(400);
	btnGoB.delay(1000).fadeIn();
	
	createPartNum();
});

//------------------------------------------------------------------------------
//	Numbers
//------------------------------------------------------------------------------

var numFF = partNum.find("#numff");
var numIn = partNum.find("#numin");
var numOut = partNum.find("#numout");

var textNumFF = numFF.find("#text_numff");
var textNumIn = numIn.find("#text_numin");
var textNumOut = numOut.find("#text_numout");

var errFormatFF = $(createErrorBox("err_format_ff", "You must enter a number"));
var errValueFF = $(createErrorBox("err_value_ff", "The number must be at least 1"));
var errMaxFF = $(createErrorBox("err_max_ff", "The number is too large"));
numFF.append(errFormatFF, errValueFF, errMaxFF);

var errFormatIn = $(createErrorBox("err_format_in", "You must enter a number"));
var errValueIn = $(createErrorBox("err_value_in", "The number must not be negative"));
var errMaxIn = $(createErrorBox("err_max_in", "The number is too large"));
numIn.append(errFormatIn, errValueIn, errMaxIn);

var errFormatOut = $(createErrorBox("err_format_out", "You must enter a number"));
var errValueOut = $(createErrorBox("err_value_out", "The number must not be negative"));
numOut.append(errFormatOut, errValueOut);

function getNumbers(){
	var ok = true;
	partNum.find("input[type=text]").removeClass("inputError");

	var numFF = parseInt(textNumFF.val());
	if(isNaN(numFF)){
		ok = false;
		errFormatFF.slideDown();
		textNumFF.addClass("inputError");
	}else{
		textNumFF.val(numFF);
		errFormatFF.slideUp();
	}

	var numIn = parseInt(textNumIn.val());
	if(isNaN(numIn)){
		ok = false;
		errFormatIn.slideDown();
		textNumIn.addClass("inputError");
	}else{
		textNumIn.val(numIn);
		errFormatIn.slideUp();
	}
	
	if(ok){
		var maxTot = 24;
		var varTot = numFF + numIn;
		if(varTot > maxTot){
			ok = false;
			
			if((numIn > maxTot) == (numFF > maxTot)){
				errMaxFF.slideDown();
				textNumFF.addClass("inputError");
				errMaxIn.slideDown();
				textNumIn.addClass("inputError");
			}else{
				if(numIn > numFF){
					errMaxIn.slideDown();
					textNumIn.addClass("inputError");
				}else{
					errMaxFF.slideDown();
					textNumFF.addClass("inputError");
				}
			}
		}else{
			errMaxFF.slideUp();
			errMaxIn.slideUp();
		}
	}

	var numOut = parseInt(textNumOut.val());
	if(isNaN(numOut)){
		ok = false;
		errFormatOut.slideDown();
		textNumOut.addClass("inputError");
	}else{
		textNumOut.val(numOut);
		errFormatOut.slideUp();
	}

	if(numFF <= 0){
		ok = false;
		errValueFF.slideDown();
		textNumFF.addClass("inputError");
	}else{
		errValueFF.slideUp();
	}

	if(numIn < 0){
		ok = false;
		errValueIn.slideDown();
		textNumIn.addClass("inputError");
	}else{
		errValueIn.slideUp();
	}

	if(numOut < 0){
		ok = false;
		errValueOut.slideDown();
		textNumOut.addClass("inputError");
	}else{
		errValueOut.slideUp();
	}

	return {valid:ok, flipflops:numFF, ins:numIn, outs:numOut};
}
	
function createPartNum(){
	returnPartNum();
}
function returnPartNum(){
	partNum.find("input").removeAttr("disabled");
	btnBackB.fadeOut();
	
	setTabIndex(partNum);
	
	btnGo.on("click", function(){
		var numbers = getNumbers();
		if(numbers.valid){
			buttons.off("click");
		
			partNum.delay(200).slideUp();
			partTypes.delay(800).slideDown();
		
			partNum.find("input").attr("disabled", "disabled");
		
			createPartTypes(numbers.flipflops, numbers.ins, numbers.outs);
		}
	});
}

//------------------------------------------------------------------------------
//	Types
//------------------------------------------------------------------------------

var partTypesTitle = document.createElement("h2");
$(partTypesTitle).append("Flip-flop Types");

function createPartTypes(numFF, numIn, numOut){
	partTypes.empty();
	partTypes.append(partTypesTitle);
	partTypes.append("<p>Select the types of each flip-flop.</p>");
	
	for(var i=0; i<numFF; i++){
		var div = document.createElement("div");
		div.id = "flipflop" + i;
		div.className = "frame"
		partTypes.append(div);
		
		var radioName = "radio_type" + i;
		var optD = createRadioElement(radioName, "D", true);
		var optJK = createRadioElement(radioName, "JK");
		var optSR = createRadioElement(radioName, "SR");
		var optT = createRadioElement(radioName, "T");
		
		var jDiv = $(div);
		jDiv.append("<label>Flip-flop " + (i+1) + "</label><br / >");
		jDiv.append(optD, optJK, optSR, optT);
	}
	
	returnPartTypes(numFF, numIn, numOut);
}
function returnPartTypes(numFF, numIn, numOut){
	partTypes.find("input").removeAttr("disabled");
	btnBackB.delay(1000).fadeIn();
	
	setTabIndex(partTypes);
	
	btnGo.on("click", function(){
		buttons.off("click");
		
		partTypes.delay(200).slideUp();
		partFunc.delay(800).slideDown();
		
		partTypes.find("input").attr("disabled", "disabled");
		
		createPartFunc(numFF, numIn, numOut);
	});
	btnBack.on("click", function(){
		buttons.off("click");
		
		partTypes.delay(200).slideUp();
		partNum.delay(800).slideDown();
		
		partTypes.find("input").attr("disabled", "disabled");
		
		returnPartNum();
	});
}

//------------------------------------------------------------------------------
//	Functions
//------------------------------------------------------------------------------

var partFuncTitle = document.createElement("h2");
$(partFuncTitle).append("Functions");

function createPartFunc(numFF, numIn, numOut){
	partFunc.empty();
	partFunc.append(partFuncTitle);
	partFunc.append("<p>Enter the functions that will represent each node.</p>");
	
	// Helpful Info
	
	var varInfo = $(document.createElement("div"));
	varInfo.hide();
	partFunc.append(varInfo);
	
	var ffVars = [];
	var inVars = [];
	
	var infoHtml = "<div class='frame'><h3>Variables</h3>You can use " + ((numFF + numIn) != 1 ? "these variables" : "this variable") + ":<br / >";
		
	for(var i=0; i<numIn; i++){
		var vn;
		if(numIn < 4){
			vn = String.fromCharCode(120 + i);
		}else{
			vn = String.fromCharCode(123 + i - numIn);
		}
		inVars.push(vn);
		
		infoHtml += "&emsp;<b>" + vn + "</b>&emsp;Input " + (i+1) + "<br / >";
	}
	for(var i=0; i<numFF; i++){
		var vn = String.fromCharCode(97 + i);
		ffVars.push(vn);
		
		infoHtml += "&emsp;<b>" + vn + "</b>&emsp;Flip-flop " + (i+1) + " initial state<br / >";
	}
	infoHtml += "</div>"
		+ "<div class='frame'><h3>Operators</h3>"
		+ "Use prime <b>'</b> as the NOT operator. It is placed after the operand <i>(a' = NOT a)</i><br / >"
		+ "Use plus <b>+</b> as the OR operator <i>(a + b = a OR b)</i><br / >"
		+ "Use no explicit operator to imply an AND operation <i>(ab = a AND b)</i><br / >"
		+ "You can use parentheses <b>()</b> for grouping</div>";
		
	varInfo.append(infoHtml);
	
	var btnHelp = $(document.createElement("a"));
	btnHelp.attr("href", "javascript:;");
	btnHelp.append("<span class='smallButton button' title='Show information'><b>?</b></span>");
	partFunc.append(btnHelp);
	
	btnHelp.on("click", function(){
		btnHelp.off("click");
		btnHelp.children().slideUp(100);
		varInfo.slideDown();
	});
	
	// Input
	
	var table = document.createElement("table");
	table.className = "columnsTable";
	partFunc.append(table);
	
	var row = document.createElement("tr");
	table.appendChild(row);
	
	var funcFF = document.createElement("td");
	funcFF.className = "half";
	row.appendChild(funcFF);
	var funcOut = document.createElement("td");
	funcOut.className = "half";
	row.appendChild(funcOut);
	
	var ffTypes = [];
	
	for(var i=0; i<numFF; i++){
		var id = "flipflop" + i;
		
		var div = document.createElement("div");
		div.id = id;
		div.className = "frame";
		var jDiv = $(div);
		
		var type = partTypes.find("#"+id+" input[type=radio]:checked").val();
		var inputs = createFFFuncInputs(type);
		
		var sing = inputs.length == 1;
		
		jDiv.append("<label>Flip-flop " + (i+1) + " <b>(" + ffVars[i] + ")</b> input" + (sing ? "" : "s") + "</label><br / >");
		
		jDiv.append(inputs);
		jDiv.append(createErrorBox("err_" + id, "You must enter " + (sing ? "a " : "") + "valid function" + (sing ? "" : "s") ));
		jDiv.append(createErrorBox("err_haha_" + id, "Ha ha ha"));
		
		funcFF.appendChild(div);
	}
	
	for(var i=0; i<numOut; i++){
		var id = "out" + i;
		
		var div = document.createElement("div");
		div.id = id;
		div.className = "frame";
		
		div.appendChild(createFuncInput("Output " + (i+1), id));
		div.appendChild(createErrorBox("err_" + id, "You must enter a valid function"));
		div.appendChild(createErrorBox("err_haha_" + id, "Ha ha ha"));
		
		funcOut.appendChild(div);
	}
	
	returnPartFunc(ffVars, inVars, numOut);
}
function returnPartFunc(ffVars, inVars, numOut){
	partFunc.find("input").removeAttr("disabled");
	btnGoB.fadeIn();
	
	setTabIndex(partFunc);
	
	var ffTypes = [];
	for(var i=0; i<ffVars.length; i++){
		ffTypes[i] = partTypes.find("#flipflop"+i+" input[type=radio]:checked").val();
	}
	
	// set an example input
	var firstField = partFunc.find("input[type=text]").first();
	var temp = [ffVars, inVars];
	
	var tid = window.setInterval(function(){
		setExampleInput();
	}, 5000);
	setExampleInput();
	
	function setExampleInput(){
		if(Math.random() < 0.5 && temp[1].length){
			temp.reverse();
		}
		var paren = 0;
		
		var example = "Example: ";
		if(Math.random() < 0.5 && temp[1].length){
			paren++;
			example += "(";
		}
		example += temp[0][0] + randPrime();
		if(temp[0].length > 1){
			example += randOperator();
			if(paren == 0 && Math.random() < 0.5 && temp[1].length){
				paren++;
				example += "(";
			}
			example += temp[0][1] + randPrime();
			if(paren > 0 && !temp[1].length){
				paren--;
				example += ")" + randPrime();
			}
		}
		if(temp[1].length){
			example += randOperator();
			example += temp[1][0] + randPrime();
			if(paren > 0 && Math.random() < 0.5){
				paren--;
				example += ")" + randPrime();
			}
			if(temp[1].length > 1){
				example += randOperator();
				example += temp[1][1] + randPrime();
			}
		}
		if(paren > 0){
			paren--;
			example += ")" + randPrime();
		}
		
		firstField.attr("placeholder", example);
			
		function randPrime(){
			return Math.random() < 0.5 ? "'" : "";
		}
		function randOperator(){
			return Math.random() < 0.5 ? "+" : "";
		}
	};
	
	btnGo.on("click", function(){
		var functions = getFunctions(ffVars, inVars, numOut);
		if(functions.valid){
			buttons.off("click");
			
			partFunc.delay(200).slideUp();
			partTable.delay(800).slideDown();
			
			partFunc.find("input").attr("disabled", "disabled");
			window.clearInterval(tid);
			
			functions["ffTypes"] = ffTypes;
			createPartTable(ffVars, inVars, functions);
		}
	});
	btnBack.on("click", function(){
		buttons.off("click");
		
		partFunc.delay(200).slideUp();
		partTypes.delay(800).slideDown();
			
		partFunc.find("input").attr("disabled", "disabled");
		window.clearInterval(tid);
		
		returnPartTypes(ffVars.length, inVars.length, numOut);
	});
}

function validateFunc(str, vars){
	var parens = 0;
	for(var i=0; i<str.length; i++){
		var c = str.charAt(i);
	
		// skip whitespace, constants, and operators
		if(/[\s+'10]/.test(c)){
			continue;
		}
	
		if(c == '('){
			parens++;
		}else if(c == ')'){
			parens--;
			if(parens < 0){
				return false;
			}
		}else if(vars.indexOf(c) == -1){
			return false;
		}
	}

	if(parens != 0) return false;
	var match = str.match(/\s*((\(*\s*[a-z10]\s*(\)?'?)+)+\s*\+\s*)*(\(*\s*[a-z10]\s*(\)?'?)+)+\s*/);
	if(match && match[0] == str){
		return true;
	}
}

function getFunctions(ffVars, inVars, numOut){
	partFunc.find("input[type=text]").removeClass("inputError");
	
	var allVars = ffVars.concat(inVars);
	
	var numFF = ffVars.length;
	var numIn = inVars.length;
	
	var ffFunctions = {};
	var outFunctions = {};
	var allValid = true;

	for(var i=0; i<numFF; i++){
		var id = "flipflop" + i;
		var div = partFunc.find("#" + id);
		
		var input = div.find("input[type=text]");
		var valid = true;
		input.each(function(){
			if(validateFunc(this.value, allVars)){
				if(valid){
					ffFunctions[id + "_" + this.id] = this.value;
				}
			}else{
				valid = false;
				this.className += " inputError";
				
				if(/.*?(valid|function).*?/.test(this.value)){
					div.find("#err_haha_" + id).slideDown();
				}
			}
		});
		
		var errorBox = div.find("#err_" + id);
		if(valid){
			errorBox.slideUp();
			div.find("#err_haha_" + id).slideUp();
		}else{
			allValid = false;
			errorBox.slideDown();
		}
	}
	for(var i=0; i<numOut; i++){
		var id = "out" + i;
		var div = partFunc.find("#" + id);
					
		var input = div.find("input[type=text]");
		var valid = true;
		input.each(function(){
			if(validateFunc(this.value, allVars)){
				if(valid){
					outFunctions[id] = this.value;
				}
			}else{
				valid = false;
				this.className += " inputError";
				
				if(/.*?(valid|function).*?/.test(this.value)){
					div.find("#err_haha_" + id).slideDown();
				}
			}
		});
		
		var errorBox = div.find("#err_" + id);
		if(valid){
			errorBox.slideUp();
			div.find("#err_haha_" + id).slideUp();
		}else{
			allValid = false;
			errorBox.slideDown();
		}
	}
	
	return {valid:allValid, ffFunctions:ffFunctions, outFunctions:outFunctions};
}

//------------------------------------------------------------------------------
//	Table
//------------------------------------------------------------------------------

var partTableTitle = document.createElement("h2");
$(partTableTitle).append("Result");

function createPartTable(ffVars, inVars, outFuncs){
	partTable.empty();
	partTable.append(partTableTitle);
	partTable.append("<p>Here are the results of the flip-flop simulation.</p>");
	
	var vars = inVars.concat(ffVars);
	var n = vars.length;
	var rows = Math.pow(2, n);
	
	var spar = $(document.createElement("div"));
	spar.append("<b>Search filter:</b><br / >");
	partTable.append(spar);
	
	var inputs = [];
	for(var i=0; i<n; i++){
		var input = document.createElement("input");
		input.maxLength = 2;
		input.style.width = "8px";
		spar.append("<b>" + vars[i] + "</b>");
		spar.append(input);
		inputs[i] = input;
		input.oninput = function(){
			var p = inputs.indexOf(this);
			if(!this.value.length){
				if(p>0){
					inputs[p-1].focus();
				}
			}
			
			var val = parseInt(this.value.charAt(0));
			if(isNaN(val) || (val != 0 && val != 1)){
				this.value = "";
			}else{
				if(this.value.length > 1){
					if(p<n-1){
						inputs[p+1].value = this.value.substr(1);
						inputs[p+1].focus();
					}
				}
				
				this.value = val;
			}
			
			filterRows(inputs, rows);
		};
	}
	
	// generate table
	
	var div = document.createElement("div");
	div.className = "frame";
	partTable.append(div);
	var table = document.createElement("table");
	table.className = "table";
	div.appendChild(table);
	var tr1 = document.createElement("tr");
	table.appendChild(tr1);
	var headers = "";
	if(inVars.length){
		headers += "<th colspan='" + inVars.length + "'>Input</th>";
	}
	headers += "<th colspan='" + ffVars.length + "'>Flip-flop State</th>";
	headers += "<th colspan='" + ffVars.length + "'>Next State</th>";
	
	var ffFunctions = outFuncs.ffFunctions;
	var outFunctions = outFuncs.outFunctions;
	var count = 0;
	for(var f in ffFunctions){
		count++;
	}
	if(count){
		headers += "<th colspan='" + count + "'>Flip-flop Input</th>";
	}
	count = 0;
	for(var f in outFunctions){
		count++;
	}
	if(count){
		headers += "<th colspan='" + count + "'>Output</th>";
	}
	$(tr1).append(headers);
	
	var tr2 = document.createElement("tr");
	table.appendChild(tr2);
	var subheaders = "";
	for(var i=0; i<n; i++){
		subheaders += "<th>" + vars[i] + "</th>";
	}
	for(var i=0; i<ffVars.length; i++){
		subheaders += "<th>" + ffVars[i] + "<sub>next</sub></th>";
	}
	
	var outJs = [];
	var outJsFF = {};
	for(var f in ffFunctions){
		subheaders += "<th><i>" + f.replace(/flipflop(\d+)_(\w+)/,
		function(match, p1, p2){
			return p2 + "<sub>" + ffVars[parseInt(p1)] + "</sub> =";
		})
		+ "</i><br / >" + ffFunctions[f] + "</th>";
		var converted = convertFunc(ffFunctions[f]);
		outJsFF[f] = converted;
		outJs.push(converted);
	}
	for(var f in outFunctions){
		subheaders += "<th><i>" + f.replace(/out(\d+).*/,
		function(match, p1){
			return "O<sub>" + (parseInt(p1) + 1) + "</sub> =";
		})
		+ "</i><br / >" + outFunctions[f] + "</th>";
		var converted = convertFunc(outFunctions[f]);
		outJs.push(converted);
	}
	$(tr2).append(subheaders);
	
	var ffTypes = outFuncs["ffTypes"];
	
	var varsObj = {};
	var varsVal = [];
	for(var i=0; i<n; i++){
		varsVal.push(false);
	}
	for(var i=0; i<rows; i++){
		// generate row
		var tr = document.createElement("tr");
		tr.id = "row" + i;
		table.appendChild(tr);
		
		var jtr = $(tr);
		for(var j=0; j<n; j++){
			varsObj[vars[j]] = varsVal[j];
			jtr.append("<td>" + (varsVal[j] ? "1" : "0") + "</td>");
		}
		for(var j=0; j<ffVars.length; j++){
			jtr.append("<td>" + (evalFF(ffVars[j], ffTypes[j], varsObj, outJsFF, j) ? "1" : "0") + "</td>");
		}
		for(var j=0; j<outJs.length; j++){
			jtr.append("<td>" + (evalFunc(outJs[j], varsObj) ? "1" : "0") + "</td>");
		}
	
		// increment permutation
		varsVal[n-1] = !varsVal[n-1];
		for(j=n-2; j>=0; j--){
			if(varsVal[j+1] == 1){
				break;
			}
			varsVal[j] = !varsVal[j];
		}
	}
	
	returnPartTable(ffVars, inVars, ffFunctions.length + outFunctions.length);
}
function returnPartTable(ffVars, inVars, outVars){
	partTable.find("input").removeAttr("disabled");
	btnGoB.fadeOut();
	
	setTabIndex(partTable);
	
	btnBack.on("click", function(){
		buttons.off("click");
		
		partTable.delay(200).slideUp();
		partFunc.delay(800).slideDown();
			
		partTable.find("input").attr("disabled", "disabled");
		
		returnPartFunc(ffVars, inVars, outVars);
	});
}

function convertFunc(str){
	var res = str.replace(/\s/g, "");
	for(var i=0; i<res.length; i++){
		var c = res.charAt(i);
		if(c == '\''){
		      var parens = 0;
		      for(var j=i-1; j>=0; j--){
		          var ch = res.charAt(j);
		          if(ch == ')'){
		              parens++;
		          }else if(ch == '('){
		              parens--;
		          }
		          if(parens == 0){
		          	res = res.slice(0,j) + "!" + res.slice(j,i) + res.slice(i+1,res.length);
		          	break;
		          }
		      }
		}
	}
	res = res.replace(/([a-z10\)])(?=[!a-z10\(])/g, "$1&&");
	res = res.replace(/\+/g, "||");
	res = res.replace(/([a-z])/g, "(vars['$1'])");
	res = res.replace(/1/g, "(true)");
	res = res.replace(/0/g, "(false)");
	return res;
}

function evalFunc(str, vars){
	var func = new Function("vars", "return " + str + ";");
	return func(vars);
}

function evalFF(ffVar, type, vars, outFuncs, ffIndex){
	var q = vars[ffVar];
	var out;
	var fid = "flipflop" + ffIndex + "_";
	if(type == "D"){
		var d = evalFunc(outFuncs[fid + "D"], vars);
		out = d;
	}else if(type == "JK"){
		var j = evalFunc(outFuncs[fid + "J"], vars);
		var k = evalFunc(outFuncs[fid + "K"], vars);
		out = (!j && !k && q) || (j && !k) || (j && k && !q);
	}else if(type == "SR"){
		var s = evalFunc(outFuncs[fid + "S"], vars);
		var r = evalFunc(outFuncs[fid + "R"], vars);
		out = (!s && !r && q) || (s && !r) || (s && r && Math.random() < 0.5);
	}else if(type == "T"){
		var t = evalFunc(outFuncs[fid + "T"], vars);
		out = (!t && q) || (t && !q);
	}else{
		throw "Invalid type! " + type;
	}
	return out;
}

function filterRows(inputs, rows){
	var vals = [];
	var n = inputs.length;
	for(var i=0; i<n; i++){
		var val = inputs[i].value;
		if(val.length){
			vals[i] = parseInt(val);
		}else{
			vals[i] = -1;
		}
	}
	
	for(var i=0, row = $("tr#row0"); i<rows; i++, row = row.next()){
		var visible = true;
		for(var j=0; j<n; j++){
			if(vals[j] != -1){
				if(vals[j] != ((i>>(n-j-1))&1)){
					visible = false;
					break;
				}
			}
		}
		
		if(visible){
			row.slideDown();
		}else{
			row.slideUp();
		}
	}
}
	
//------------------------------------------------------------------------------
//
//	Helpers
//
//------------------------------------------------------------------------------

function createErrorBox(id, msg){
	var div = document.createElement("div");
	div.className = "errorContainer";
	div.id = id;
	var jDiv = $(div);
	jDiv.append("<span class='error'>"+msg+"</span>");
	jDiv.hide();
	
	return div;
}

function createFFFuncInputs(type){
	var divs;
	
	if(type == "D"){
		divs = [createFuncInput("¥ D", "D", true)];
	}else if(type == "JK"){
		divs = [
			createFuncInput("¥ J", "J", true),
			createFuncInput("¥ K", "K", true)
		];
	}else if(type == "SR"){
		divs = [
			createFuncInput("¥ S", "S", true),
			createFuncInput("¥ R", "R", true)
		];
	}else if(type == "T"){
		divs = [createFuncInput("¥ T", "T", true)];
	}else{
		throw "Invalid type! type=" + type;
	}
	
	return divs;
}

function createFuncInput(label, id, line){
	var div = document.createElement("div");
	
	var input = document.createElement("input");
	input.type = "text";
	input.id = id;
	
	var jDiv = $(div);
	jDiv.append("<label for='"+id+"'>" + label + "</label>");
	if(!line){
		jDiv.append("<br / >");
	}
	jDiv.append(input);
	
	return div;
}

// http://stackoverflow.com/questions/118693/how-do-you-dynamically-create-a-radio-button-in-javascript-that-works-in-all-bro
function createRadioElement(name, value, checked) {
    var radioHtml = "<span><input type='radio' name='" + name + "' value='" + value + "'";
    if ( checked ) {
        radioHtml += " checked='checked'";
    }
    radioHtml += " / ><label for='"+name+value+"'>" + value + "</label></span>";

    var radioFragment = document.createElement('div');
    radioFragment.innerHTML = radioHtml;

    return radioFragment.firstChild;
}

function setTabIndex(jContainer){
	$("*").removeAttr("tabindex");
	var inputs = jContainer.find("input");
	inputs.each(function(index){
		this.tabIndex = index + 1;
	});
	inputs.first().focus();
	
	var size = inputs.size();
	if(btnGoB.is(":visible")){
		btnGo.attr("tabindex", ++size);
	}
	if(btnBackB.is(":visible")){
		btnBack.attr("tabindex", ++size);
	}
}

});
