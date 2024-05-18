"use strict";

/*
 *	Minimizes Boolean functions
 *
 *	paramters
 *		int[] minterms - array of minterms
 *		int numVars - minimum number of variables
 *	returns
 *		String - minimized function
 */
function qm(minterms, numVars){
	numVars = calcVars(minterms, numVars);
	return implicantsToFunction(findEsPrImplicants(minterms, numVars), numVars);
}

// log
function log(str){
	document.getElementById("log").innerHTML += str + "<br/>";
}

var util = {};

/*
 *	Counts the number of one bits in the binary form of the integer
 *	
 *	parameters
 *		int integer
 *	returns
 *		int
 */
util.popCount = function(integer){
	var count = 0;
	while(integer){
		count += integer & 1;
		integer >>= 1;
	}
	return count;
}

/*
 *	Calculates the Hamming/Gray code distance between the binary representations of two integers
 *	The distance is the difference in bits of the two integers
 *	
 *	parameters
 *		int a
 *		int b
 *	returns
 *		int
 */
util.grayCodeDist = function(a, b){
	return util.popCount(a ^ b);
}
util.hammingDist = util.grayCodeDist;

/*
 *	Checks whether two integers are adjacent in Gray code
 *	
 *	parameters
 *		int a
 *		int b
 *	returns
 *		int
 */
util.adjacent = function(a, b){
	return util.grayCodeDist(a, b) == 1;
}

//	override toString of Array for debug
Array.prototype.toStringOld = Array.prototype.toString;
Array.prototype.toString = function(){
	return "{ " + this.toStringOld() + " }";
}

//=============================================================================
// class Implicant
//-----------------------------------------------------------------------------

function Implicant(binary, dnm){
	this.binary = binary |= 0;
	this.dnm = dnm |= 0;
	
	this.minterms = [];
	
	this.prime = false;
	this.essential = false;
}

function createImplicantWithMinterm(minterm){
	var imp = new Implicant(minterm);
	imp.minterms = [minterm];
	return imp;
}

Implicant.prototype.combine = function(other){
	if(!this.adjacent(other)){
		return null;
	}
	
	var cDnm = (this.binary ^ other.binary) | this.dnm | other.dnm;
	var cBinary = this.binary & other.binary;
	var imp = new Implicant(cBinary, cDnm);
	
	imp.minterms = this.minterms.concat();
	var mt;
	var i, n;
	for(i=0, n=other.minterms.length; i<n; i++){
		mt = other.minterms[i];
		if(imp.minterms.indexOf(mt) == -1){
			imp.minterms.push(mt);
		}
	}
	
	return imp;
}

Implicant.prototype.adjacent = function(other){
	if(this.dnm == other.dnm){
		return util.adjacent(this.binary | this.dnm, other.binary | other.dnm)
			&& util.adjacent(this.binary & ~this.dnm, other.binary & ~other.dnm)
	}else{
		return util.adjacent(this.dnm, other.dnm)
			&& ((this.binary | this.dnm == other.binary | other.dnm)
				|| (this.binary & ~this.dnm == other.binary & ~other.dnm))
	};
}

Implicant.prototype.setPrime = function(value){
	this.prime = value;
}

Implicant.prototype.setEssential = function(value){
	this.essential = value;
}

Implicant.prototype.toString = function(){
	return "m" + minterms;
}
Implicant.prototype.toProduct = function(numVars){
	var ch = "a".charCodeAt(0);
	var result = "";
	
	if(this.dnm == Math.pow(2,numVars)-1){
		return "1";
	}
	
	var mask = Math.pow(2,numVars-1);
	var i = numVars;
	while(i > 0){
		if(~this.dnm & mask){
			result += String.fromCharCode(ch) + ((~this.binary & mask) ? "'" : "");
		}
	
		mask >>= 1;
		ch++;
		i--;
	}
	
	return result;
}

//-----------------------------------------------------------------------------
//=============================================================================


/*
 *	Calculates number of variables required for given minterms
 *
 *	paramters
 *		int[] minterms - array of minterms
 *		int minVars - minimum number
 *	returns
 *		int - number of variables
 */
function calcVars(minterms, minVars){
	var mt;
	var i, n;
	for(i = 0, n = minterms.length; i < n; i++){
		mt = parseInt(minterms[i]);
		while(mt >= Math.pow(2, minVars)){
			minVars++;
		}
	}
	
	return minVars;
}

/*
 *	Finds the essential prime implicants from a set of minterms
 *	Quine-McCluskey algorithm
 *	
 *	parameters
 *		int[] minterms
 *		int numVars - number of variables
 *	returns
 *		Implicant[] - array of essential prime implicants
 */
function findEsPrImplicants(minterms, numVars){
	// Construct initial table, get implicants from minterms
	var implicants = [];
	
	var mt, obits, iarr, imp;
	var i, n;
	for(i = 0, n = minterms.length; i < n; i++){
		mt = minterms[i] = parseInt(minterms[i]);
		imp = createImplicantWithMinterm(mt);
		imp.setPrime(true); // assume prime until proven guilty
		
		obits = util.popCount(mt);
		iarr = implicants[obits] = implicants[obits] || [];
		iarr.push(imp);
	}
	
	// Combine implicants to find prime implicants
	var primeImplicants = [];
	
	var nextImplicants;
	var g1, g2, imp1, imp2, comb;
	var j, k, m, o;
	var hasCombined;
	
	do{
		hasCombined = false;
		nextImplicants = [];
		for(i = 0, n = implicants.length - 1; i < n; i++){
			// for each pair of adjacent rows
			g1 = implicants[i] = implicants[i] || [];
			g2 = implicants[i+1] = implicants[i+1] || [];
			
			// for each implicant in both rows
			for(j = 0, m = g1.length; j < m; j++){
				imp1 = g1[j];
				for(k = 0, o = g2.length; k < o; k++){
					imp2 = g2[k];
					
					// combine implicants
					comb = imp1.combine(imp2);
					if(comb){
						iarr = nextImplicants[i] = nextImplicants[i] || [];
						iarr.push(comb);
						
						imp1.setPrime(false);
						imp2.setPrime(false);
						comb.setPrime(true);
						hasCombined = true;
					}
				}
			}
		}
		
		// store uncombined implicants as prime implicants
		for(i = 0, n = implicants.length; i < n; i++){
			g1 = implicants[i];
			for(j = 0, m = g1.length; j < m; j++){
				imp = g1[j];
				if(imp.prime){
					primeImplicants.push(imp);
				}
			}
		}
		
		implicants = nextImplicants;
	}while(hasCombined);
	
	// store remaining (uncombined) implicants to prime implicants
	for(i = 0, n = implicants.length; i < n; i++){
		g1 = implicants[i] || [];
		for(j = 0, m = g1.length; j < m; j++){
			primeImplicants.push(g1[j]);
		}
	}
	
	// remove duplicates
	for(i = primeImplicants.length-1; i >= 0; i--){
		for(j = i-1; j >= 0; j--){
			imp1 = primeImplicants[i];
			imp2 = primeImplicants[j];
			
			if(imp1.binary == imp2.binary && imp1.dnm == imp2.dnm){
				imp2.minterms = imp1.minterms.length > imp2.minterms.length ? imp1.minterms : imp2.minterms;
				primeImplicants.splice(i, 1);
				break;
			}
		}
	}	
	
	// Find essential prime implicants
	var essentialImplicants = [];
	
	var mintermCovers = [];
	for(i = minterms.length-1; i>=0; i--){
		mintermCovers[minterms[i]] = [];
	}
	
	// find "covers" for each minterm
	for(i = primeImplicants.length-1; i>=0; i--){
		imp = primeImplicants[i];
		for(j = imp.minterms.length-1; j>=0; j--){
			mintermCovers[imp.minterms[j]].push(imp);
		}
	}
	
	// finding essential prime implicants
	var covers;
	for(i = mintermCovers.length-1; i>=0; i--){
		covers = mintermCovers[i];
		if(covers && covers.length == 1){
			// minterm with single cover is covered by an essential prime implicant
			imp = covers[0];
			essentialImplicants.push(imp);
			for(j = imp.minterms.length-1; j>=0; j--){
				mintermCovers[imp.minterms[j]].length = 0;
			}
		}
	}
	
	// find minterms left uncovered by essential implicants
	//	(filtered)
	var covers;
	for(i = mintermCovers.length-1; i>=0; i--){
		covers = mintermCovers[i];
		if(covers && covers.length){
			imp = covers[0];
			var ok = true;
			for(j = imp.minterms.length-1; j>=0; j--){
				if(!mintermCovers[imp.minterms[j]].length){
					ok = false;
					break;
				}
			}
			if(ok){
				essentialImplicants.push(imp);
				for(j = imp.minterms.length-1; j>=0; j--){
					mintermCovers[imp.minterms[j]].length = 0;
				}
			}
		}
	}
	
	// find minterms left uncovered by essential implicants
	//	(all)
	for(i = mintermCovers.length-1; i>=0; i--){
		covers = mintermCovers[i];
		if(covers && covers.length){
			imp = covers[0];
			essentialImplicants.push(imp);
			for(j = imp.minterms.length-1; j>=0; j--){
				mintermCovers[imp.minterms[j]].length = 0;
			}
		}
	}
	
	// sort
	for(i = essentialImplicants.length-1; i>=0; i--){
		essentialImplicants[i].minterms.sort();
	}
	
	return essentialImplicants;
}

/*
 *	Formats the function representation of a set of implicants
 *	
 *	parameters
 *		Implicant[] implicants
 *		int numVars - number of variables
 *	returns
 *		String - the function as String
 */
function implicantsToFunction(implicants, numVars){
	var result = "";
	
	var len = implicants.length;
	if(len == 0){
		return "0";
	}
	
	var i;
	var products = [];
	for(i = 0; i<len; i++){
		products.push(implicants[i].toProduct(numVars));
	}
	products.sort();
	for(i = 0; i<len; i++){
		result += products[i] + (i < len-1 ? " + " : "");
	}
	
	return result;
}
