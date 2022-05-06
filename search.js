(function () {
	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var strictUriEncode = str => encodeURIComponent(str).replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

	var token = '%[a-f0-9]{2}';
	var singleMatcher = new RegExp(token, 'gi');
	var multiMatcher = new RegExp('(' + token + ')+', 'gi');

	function decodeComponents(components, split) {
		try {
			// Try to decode the entire string first
			return decodeURIComponent(components.join(''));
		} catch (err) {
			// Do nothing
		}

		if (components.length === 1) {
			return components;
		}

		split = split || 1;

		// Split the array in 2 parts
		var left = components.slice(0, split);
		var right = components.slice(split);

		return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
	}

	function decode(input) {
		try {
			return decodeURIComponent(input);
		} catch (err) {
			var tokens = input.match(singleMatcher);

			for (var i = 1; i < tokens.length; i++) {
				input = decodeComponents(tokens, i).join('');

				tokens = input.match(singleMatcher);
			}

			return input;
		}
	}

	function customDecodeURIComponent(input) {
		// Keep track of all the replacements and prefill the map with the `BOM`
		var replaceMap = {
			'%FE%FF': '\uFFFD\uFFFD',
			'%FF%FE': '\uFFFD\uFFFD'
		};

		var match = multiMatcher.exec(input);
		while (match) {
			try {
				// Decode as big chunks as possible
				replaceMap[match[0]] = decodeURIComponent(match[0]);
			} catch (err) {
				var result = decode(match[0]);

				if (result !== match[0]) {
					replaceMap[match[0]] = result;
				}
			}

			match = multiMatcher.exec(input);
		}

		// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
		replaceMap['%C2'] = '\uFFFD';

		var entries = Object.keys(replaceMap);

		for (var i = 0; i < entries.length; i++) {
			// Replace all decoded components
			var key = entries[i];
			input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
		}

		return input;
	}

	var decodeUriComponent = function (encodedURI) {
		if (typeof encodedURI !== 'string') {
			throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
		}

		try {
			encodedURI = encodedURI.replace(/\+/g, ' ');

			// Try the built in decoder first
			return decodeURIComponent(encodedURI);
		} catch (err) {
			// Fallback to a more advanced decoder
			return customDecodeURIComponent(encodedURI);
		}
	};

	var splitOnFirst = (string, separator) => {
		if (!(typeof string === 'string' && typeof separator === 'string')) {
			throw new TypeError('Expected the arguments to be of type `string`');
		}

		if (separator === '') {
			return [string];
		}

		const separatorIndex = string.indexOf(separator);

		if (separatorIndex === -1) {
			return [string];
		}

		return [
			string.slice(0, separatorIndex),
			string.slice(separatorIndex + separator.length)
		];
	};

	var filterObj = function (obj, predicate) {
		var ret = {};
		var keys = Object.keys(obj);
		var isArr = Array.isArray(predicate);

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var val = obj[key];

			if (isArr ? predicate.indexOf(key) !== -1 : predicate(key, val, obj)) {
				ret[key] = val;
			}
		}

		return ret;
	};

	var queryString = createCommonjsModule(function (module, exports) {





	const isNullOrUndefined = value => value === null || value === undefined;

	function encoderForArrayFormat(options) {
		switch (options.arrayFormat) {
			case 'index':
				return key => (result, value) => {
					const index = result.length;

					if (
						value === undefined ||
						(options.skipNull && value === null) ||
						(options.skipEmptyString && value === '')
					) {
						return result;
					}

					if (value === null) {
						return [...result, [encode(key, options), '[', index, ']'].join('')];
					}

					return [
						...result,
						[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')
					];
				};

			case 'bracket':
				return key => (result, value) => {
					if (
						value === undefined ||
						(options.skipNull && value === null) ||
						(options.skipEmptyString && value === '')
					) {
						return result;
					}

					if (value === null) {
						return [...result, [encode(key, options), '[]'].join('')];
					}

					return [...result, [encode(key, options), '[]=', encode(value, options)].join('')];
				};

			case 'comma':
			case 'separator':
				return key => (result, value) => {
					if (value === null || value === undefined || value.length === 0) {
						return result;
					}

					if (result.length === 0) {
						return [[encode(key, options), '=', encode(value, options)].join('')];
					}

					return [[result, encode(value, options)].join(options.arrayFormatSeparator)];
				};

			default:
				return key => (result, value) => {
					if (
						value === undefined ||
						(options.skipNull && value === null) ||
						(options.skipEmptyString && value === '')
					) {
						return result;
					}

					if (value === null) {
						return [...result, encode(key, options)];
					}

					return [...result, [encode(key, options), '=', encode(value, options)].join('')];
				};
		}
	}

	function parserForArrayFormat(options) {
		let result;

		switch (options.arrayFormat) {
			case 'index':
				return (key, value, accumulator) => {
					result = /\[(\d*)\]$/.exec(key);

					key = key.replace(/\[\d*\]$/, '');

					if (!result) {
						accumulator[key] = value;
						return;
					}

					if (accumulator[key] === undefined) {
						accumulator[key] = {};
					}

					accumulator[key][result[1]] = value;
				};

			case 'bracket':
				return (key, value, accumulator) => {
					result = /(\[\])$/.exec(key);
					key = key.replace(/\[\]$/, '');

					if (!result) {
						accumulator[key] = value;
						return;
					}

					if (accumulator[key] === undefined) {
						accumulator[key] = [value];
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};

			case 'comma':
			case 'separator':
				return (key, value, accumulator) => {
					const isArray = typeof value === 'string' && value.includes(options.arrayFormatSeparator);
					const isEncodedArray = (typeof value === 'string' && !isArray && decode(value, options).includes(options.arrayFormatSeparator));
					value = isEncodedArray ? decode(value, options) : value;
					const newValue = isArray || isEncodedArray ? value.split(options.arrayFormatSeparator).map(item => decode(item, options)) : value === null ? value : decode(value, options);
					accumulator[key] = newValue;
				};

			default:
				return (key, value, accumulator) => {
					if (accumulator[key] === undefined) {
						accumulator[key] = value;
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};
		}
	}

	function validateArrayFormatSeparator(value) {
		if (typeof value !== 'string' || value.length !== 1) {
			throw new TypeError('arrayFormatSeparator must be single character string');
		}
	}

	function encode(value, options) {
		if (options.encode) {
			return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
		}

		return value;
	}

	function decode(value, options) {
		if (options.decode) {
			return decodeUriComponent(value);
		}

		return value;
	}

	function keysSorter(input) {
		if (Array.isArray(input)) {
			return input.sort();
		}

		if (typeof input === 'object') {
			return keysSorter(Object.keys(input))
				.sort((a, b) => Number(a) - Number(b))
				.map(key => input[key]);
		}

		return input;
	}

	function removeHash(input) {
		const hashStart = input.indexOf('#');
		if (hashStart !== -1) {
			input = input.slice(0, hashStart);
		}

		return input;
	}

	function getHash(url) {
		let hash = '';
		const hashStart = url.indexOf('#');
		if (hashStart !== -1) {
			hash = url.slice(hashStart);
		}

		return hash;
	}

	function extract(input) {
		input = removeHash(input);
		const queryStart = input.indexOf('?');
		if (queryStart === -1) {
			return '';
		}

		return input.slice(queryStart + 1);
	}

	function parseValue(value, options) {
		if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
			value = Number(value);
		} else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
			value = value.toLowerCase() === 'true';
		}

		return value;
	}

	function parse(query, options) {
		options = Object.assign({
			decode: true,
			sort: true,
			arrayFormat: 'none',
			arrayFormatSeparator: ',',
			parseNumbers: false,
			parseBooleans: false
		}, options);

		validateArrayFormatSeparator(options.arrayFormatSeparator);

		const formatter = parserForArrayFormat(options);

		// Create an object with no prototype
		const ret = Object.create(null);

		if (typeof query !== 'string') {
			return ret;
		}

		query = query.trim().replace(/^[?#&]/, '');

		if (!query) {
			return ret;
		}

		for (const param of query.split('&')) {
			if (param === '') {
				continue;
			}

			let [key, value] = splitOnFirst(options.decode ? param.replace(/\+/g, ' ') : param, '=');

			// Missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			value = value === undefined ? null : ['comma', 'separator'].includes(options.arrayFormat) ? value : decode(value, options);
			formatter(decode(key, options), value, ret);
		}

		for (const key of Object.keys(ret)) {
			const value = ret[key];
			if (typeof value === 'object' && value !== null) {
				for (const k of Object.keys(value)) {
					value[k] = parseValue(value[k], options);
				}
			} else {
				ret[key] = parseValue(value, options);
			}
		}

		if (options.sort === false) {
			return ret;
		}

		return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce((result, key) => {
			const value = ret[key];
			if (Boolean(value) && typeof value === 'object' && !Array.isArray(value)) {
				// Sort object keys, not values
				result[key] = keysSorter(value);
			} else {
				result[key] = value;
			}

			return result;
		}, Object.create(null));
	}

	exports.extract = extract;
	exports.parse = parse;

	exports.stringify = (object, options) => {
		if (!object) {
			return '';
		}

		options = Object.assign({
			encode: true,
			strict: true,
			arrayFormat: 'none',
			arrayFormatSeparator: ','
		}, options);

		validateArrayFormatSeparator(options.arrayFormatSeparator);

		const shouldFilter = key => (
			(options.skipNull && isNullOrUndefined(object[key])) ||
			(options.skipEmptyString && object[key] === '')
		);

		const formatter = encoderForArrayFormat(options);

		const objectCopy = {};

		for (const key of Object.keys(object)) {
			if (!shouldFilter(key)) {
				objectCopy[key] = object[key];
			}
		}

		const keys = Object.keys(objectCopy);

		if (options.sort !== false) {
			keys.sort(options.sort);
		}

		return keys.map(key => {
			const value = object[key];

			if (value === undefined) {
				return '';
			}

			if (value === null) {
				return encode(key, options);
			}

			if (Array.isArray(value)) {
				return value
					.reduce(formatter(key), [])
					.join('&');
			}

			return encode(key, options) + '=' + encode(value, options);
		}).filter(x => x.length > 0).join('&');
	};

	exports.parseUrl = (url, options) => {
		options = Object.assign({
			decode: true
		}, options);

		const [url_, hash] = splitOnFirst(url, '#');

		return Object.assign(
			{
				url: url_.split('?')[0] || '',
				query: parse(extract(url), options)
			},
			options && options.parseFragmentIdentifier && hash ? {fragmentIdentifier: decode(hash, options)} : {}
		);
	};

	exports.stringifyUrl = (object, options) => {
		options = Object.assign({
			encode: true,
			strict: true
		}, options);

		const url = removeHash(object.url).split('?')[0] || '';
		const queryFromUrl = exports.extract(object.url);
		const parsedQueryFromUrl = exports.parse(queryFromUrl, {sort: false});

		const query = Object.assign(parsedQueryFromUrl, object.query);
		let queryString = exports.stringify(query, options);
		if (queryString) {
			queryString = `?${queryString}`;
		}

		let hash = getHash(object.url);
		if (object.fragmentIdentifier) {
			hash = `#${encode(object.fragmentIdentifier, options)}`;
		}

		return `${url}${queryString}${hash}`;
	};

	exports.pick = (input, filter, options) => {
		options = Object.assign({
			parseFragmentIdentifier: true
		}, options);

		const {url, query, fragmentIdentifier} = exports.parseUrl(input, options);
		return exports.stringifyUrl({
			url,
			query: filterObj(query, filter),
			fragmentIdentifier
		}, options);
	};

	exports.exclude = (input, filter, options) => {
		const exclusionFilter = Array.isArray(filter) ? key => !filter.includes(key) : (key, value) => !filter(key, value);

		return exports.pick(input, exclusionFilter, options);
	};
	});
	var queryString_1 = queryString.extract;
	var queryString_2 = queryString.parse;
	var queryString_3 = queryString.stringify;
	var queryString_4 = queryString.parseUrl;
	var queryString_5 = queryString.stringifyUrl;
	var queryString_6 = queryString.pick;
	var queryString_7 = queryString.exclude;

	var bind = function bind(fn, thisArg) {
	  return function wrap() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    return fn.apply(thisArg, args);
	  };
	};

	/*!
	 * Determine if an object is a Buffer
	 *
	 * @author   Feross Aboukhadijeh <https://feross.org>
	 * @license  MIT
	 */

	var isBuffer = function isBuffer (obj) {
	  return obj != null && obj.constructor != null &&
	    typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	};

	/*global toString:true*/

	// utils is a library of generic helper functions non-specific to axios

	var toString = Object.prototype.toString;

	/**
	 * Determine if a value is an Array
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Array, otherwise false
	 */
	function isArray(val) {
	  return toString.call(val) === '[object Array]';
	}

	/**
	 * Determine if a value is an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
	 */
	function isArrayBuffer(val) {
	  return toString.call(val) === '[object ArrayBuffer]';
	}

	/**
	 * Determine if a value is a FormData
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an FormData, otherwise false
	 */
	function isFormData(val) {
	  return (typeof FormData !== 'undefined') && (val instanceof FormData);
	}

	/**
	 * Determine if a value is a view on an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	 */
	function isArrayBufferView(val) {
	  var result;
	  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
	    result = ArrayBuffer.isView(val);
	  } else {
	    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
	  }
	  return result;
	}

	/**
	 * Determine if a value is a String
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a String, otherwise false
	 */
	function isString(val) {
	  return typeof val === 'string';
	}

	/**
	 * Determine if a value is a Number
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Number, otherwise false
	 */
	function isNumber(val) {
	  return typeof val === 'number';
	}

	/**
	 * Determine if a value is undefined
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if the value is undefined, otherwise false
	 */
	function isUndefined(val) {
	  return typeof val === 'undefined';
	}

	/**
	 * Determine if a value is an Object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Object, otherwise false
	 */
	function isObject(val) {
	  return val !== null && typeof val === 'object';
	}

	/**
	 * Determine if a value is a Date
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Date, otherwise false
	 */
	function isDate(val) {
	  return toString.call(val) === '[object Date]';
	}

	/**
	 * Determine if a value is a File
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a File, otherwise false
	 */
	function isFile(val) {
	  return toString.call(val) === '[object File]';
	}

	/**
	 * Determine if a value is a Blob
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Blob, otherwise false
	 */
	function isBlob(val) {
	  return toString.call(val) === '[object Blob]';
	}

	/**
	 * Determine if a value is a Function
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Function, otherwise false
	 */
	function isFunction(val) {
	  return toString.call(val) === '[object Function]';
	}

	/**
	 * Determine if a value is a Stream
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Stream, otherwise false
	 */
	function isStream(val) {
	  return isObject(val) && isFunction(val.pipe);
	}

	/**
	 * Determine if a value is a URLSearchParams object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
	 */
	function isURLSearchParams(val) {
	  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
	}

	/**
	 * Trim excess whitespace off the beginning and end of a string
	 *
	 * @param {String} str The String to trim
	 * @returns {String} The String freed of excess whitespace
	 */
	function trim(str) {
	  return str.replace(/^\s*/, '').replace(/\s*$/, '');
	}

	/**
	 * Determine if we're running in a standard browser environment
	 *
	 * This allows axios to run in a web worker, and react-native.
	 * Both environments support XMLHttpRequest, but not fully standard globals.
	 *
	 * web workers:
	 *  typeof window -> undefined
	 *  typeof document -> undefined
	 *
	 * react-native:
	 *  navigator.product -> 'ReactNative'
	 */
	function isStandardBrowserEnv() {
	  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
	    return false;
	  }
	  return (
	    typeof window !== 'undefined' &&
	    typeof document !== 'undefined'
	  );
	}

	/**
	 * Iterate over an Array or an Object invoking a function for each item.
	 *
	 * If `obj` is an Array callback will be called passing
	 * the value, index, and complete array for each item.
	 *
	 * If 'obj' is an Object callback will be called passing
	 * the value, key, and complete object for each property.
	 *
	 * @param {Object|Array} obj The object to iterate
	 * @param {Function} fn The callback to invoke for each item
	 */
	function forEach(obj, fn) {
	  // Don't bother if no value provided
	  if (obj === null || typeof obj === 'undefined') {
	    return;
	  }

	  // Force an array if not already something iterable
	  if (typeof obj !== 'object') {
	    /*eslint no-param-reassign:0*/
	    obj = [obj];
	  }

	  if (isArray(obj)) {
	    // Iterate over array values
	    for (var i = 0, l = obj.length; i < l; i++) {
	      fn.call(null, obj[i], i, obj);
	    }
	  } else {
	    // Iterate over object keys
	    for (var key in obj) {
	      if (Object.prototype.hasOwnProperty.call(obj, key)) {
	        fn.call(null, obj[key], key, obj);
	      }
	    }
	  }
	}

	/**
	 * Accepts varargs expecting each argument to be an object, then
	 * immutably merges the properties of each object and returns result.
	 *
	 * When multiple objects contain the same key the later object in
	 * the arguments list will take precedence.
	 *
	 * Example:
	 *
	 * ```js
	 * var result = merge({foo: 123}, {foo: 456});
	 * console.log(result.foo); // outputs 456
	 * ```
	 *
	 * @param {Object} obj1 Object to merge
	 * @returns {Object} Result of all merge properties
	 */
	function merge(/* obj1, obj2, obj3, ... */) {
	  var result = {};
	  function assignValue(val, key) {
	    if (typeof result[key] === 'object' && typeof val === 'object') {
	      result[key] = merge(result[key], val);
	    } else {
	      result[key] = val;
	    }
	  }

	  for (var i = 0, l = arguments.length; i < l; i++) {
	    forEach(arguments[i], assignValue);
	  }
	  return result;
	}

	/**
	 * Extends object a by mutably adding to it the properties of object b.
	 *
	 * @param {Object} a The object to be extended
	 * @param {Object} b The object to copy properties from
	 * @param {Object} thisArg The object to bind function to
	 * @return {Object} The resulting value of object a
	 */
	function extend(a, b, thisArg) {
	  forEach(b, function assignValue(val, key) {
	    if (thisArg && typeof val === 'function') {
	      a[key] = bind(val, thisArg);
	    } else {
	      a[key] = val;
	    }
	  });
	  return a;
	}

	var utils = {
	  isArray: isArray,
	  isArrayBuffer: isArrayBuffer,
	  isBuffer: isBuffer,
	  isFormData: isFormData,
	  isArrayBufferView: isArrayBufferView,
	  isString: isString,
	  isNumber: isNumber,
	  isObject: isObject,
	  isUndefined: isUndefined,
	  isDate: isDate,
	  isFile: isFile,
	  isBlob: isBlob,
	  isFunction: isFunction,
	  isStream: isStream,
	  isURLSearchParams: isURLSearchParams,
	  isStandardBrowserEnv: isStandardBrowserEnv,
	  forEach: forEach,
	  merge: merge,
	  extend: extend,
	  trim: trim
	};

	var global$1 = (typeof global !== "undefined" ? global :
	            typeof self !== "undefined" ? self :
	            typeof window !== "undefined" ? window : {});

	// shim for using process in browser
	// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	var cachedSetTimeout = defaultSetTimout;
	var cachedClearTimeout = defaultClearTimeout;
	if (typeof global$1.setTimeout === 'function') {
	    cachedSetTimeout = setTimeout;
	}
	if (typeof global$1.clearTimeout === 'function') {
	    cachedClearTimeout = clearTimeout;
	}

	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	function nextTick(fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	}
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	var title = 'browser';
	var platform = 'browser';
	var browser = true;
	var env = {};
	var argv = [];
	var version = ''; // empty string to avoid regexp issues
	var versions = {};
	var release = {};
	var config = {};

	function noop() {}

	var on = noop;
	var addListener = noop;
	var once = noop;
	var off = noop;
	var removeListener = noop;
	var removeAllListeners = noop;
	var emit = noop;

	function binding(name) {
	    throw new Error('process.binding is not supported');
	}

	function cwd () { return '/' }
	function chdir (dir) {
	    throw new Error('process.chdir is not supported');
	}function umask() { return 0; }

	// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
	var performance = global$1.performance || {};
	var performanceNow =
	  performance.now        ||
	  performance.mozNow     ||
	  performance.msNow      ||
	  performance.oNow       ||
	  performance.webkitNow  ||
	  function(){ return (new Date()).getTime() };

	// generate timestamp or delta
	// see http://nodejs.org/api/process.html#process_process_hrtime
	function hrtime(previousTimestamp){
	  var clocktime = performanceNow.call(performance)*1e-3;
	  var seconds = Math.floor(clocktime);
	  var nanoseconds = Math.floor((clocktime%1)*1e9);
	  if (previousTimestamp) {
	    seconds = seconds - previousTimestamp[0];
	    nanoseconds = nanoseconds - previousTimestamp[1];
	    if (nanoseconds<0) {
	      seconds--;
	      nanoseconds += 1e9;
	    }
	  }
	  return [seconds,nanoseconds]
	}

	var startTime = new Date();
	function uptime() {
	  var currentTime = new Date();
	  var dif = currentTime - startTime;
	  return dif / 1000;
	}

	var process = {
	  nextTick: nextTick,
	  title: title,
	  browser: browser,
	  env: env,
	  argv: argv,
	  version: version,
	  versions: versions,
	  on: on,
	  addListener: addListener,
	  once: once,
	  off: off,
	  removeListener: removeListener,
	  removeAllListeners: removeAllListeners,
	  emit: emit,
	  binding: binding,
	  cwd: cwd,
	  chdir: chdir,
	  umask: umask,
	  hrtime: hrtime,
	  platform: platform,
	  release: release,
	  config: config,
	  uptime: uptime
	};

	var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
	  utils.forEach(headers, function processHeader(value, name) {
	    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
	      headers[normalizedName] = value;
	      delete headers[name];
	    }
	  });
	};

	/**
	 * Update an Error with the specified config, error code, and response.
	 *
	 * @param {Error} error The error to update.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The error.
	 */
	var enhanceError = function enhanceError(error, config, code, request, response) {
	  error.config = config;
	  if (code) {
	    error.code = code;
	  }
	  error.request = request;
	  error.response = response;
	  return error;
	};

	/**
	 * Create an Error with the specified message, config, error code, request and response.
	 *
	 * @param {string} message The error message.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The created error.
	 */
	var createError = function createError(message, config, code, request, response) {
	  var error = new Error(message);
	  return enhanceError(error, config, code, request, response);
	};

	/**
	 * Resolve or reject a Promise based on response status.
	 *
	 * @param {Function} resolve A function that resolves the promise.
	 * @param {Function} reject A function that rejects the promise.
	 * @param {object} response The response.
	 */
	var settle = function settle(resolve, reject, response) {
	  var validateStatus = response.config.validateStatus;
	  // Note: status is not exposed by XDomainRequest
	  if (!response.status || !validateStatus || validateStatus(response.status)) {
	    resolve(response);
	  } else {
	    reject(createError(
	      'Request failed with status code ' + response.status,
	      response.config,
	      null,
	      response.request,
	      response
	    ));
	  }
	};

	function encode(val) {
	  return encodeURIComponent(val).
	    replace(/%40/gi, '@').
	    replace(/%3A/gi, ':').
	    replace(/%24/g, '$').
	    replace(/%2C/gi, ',').
	    replace(/%20/g, '+').
	    replace(/%5B/gi, '[').
	    replace(/%5D/gi, ']');
	}

	/**
	 * Build a URL by appending params to the end
	 *
	 * @param {string} url The base of the url (e.g., http://www.google.com)
	 * @param {object} [params] The params to be appended
	 * @returns {string} The formatted url
	 */
	var buildURL = function buildURL(url, params, paramsSerializer) {
	  /*eslint no-param-reassign:0*/
	  if (!params) {
	    return url;
	  }

	  var serializedParams;
	  if (paramsSerializer) {
	    serializedParams = paramsSerializer(params);
	  } else if (utils.isURLSearchParams(params)) {
	    serializedParams = params.toString();
	  } else {
	    var parts = [];

	    utils.forEach(params, function serialize(val, key) {
	      if (val === null || typeof val === 'undefined') {
	        return;
	      }

	      if (utils.isArray(val)) {
	        key = key + '[]';
	      } else {
	        val = [val];
	      }

	      utils.forEach(val, function parseValue(v) {
	        if (utils.isDate(v)) {
	          v = v.toISOString();
	        } else if (utils.isObject(v)) {
	          v = JSON.stringify(v);
	        }
	        parts.push(encode(key) + '=' + encode(v));
	      });
	    });

	    serializedParams = parts.join('&');
	  }

	  if (serializedParams) {
	    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
	  }

	  return url;
	};

	// Headers whose duplicates are ignored by node
	// c.f. https://nodejs.org/api/http.html#http_message_headers
	var ignoreDuplicateOf = [
	  'age', 'authorization', 'content-length', 'content-type', 'etag',
	  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
	  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
	  'referer', 'retry-after', 'user-agent'
	];

	/**
	 * Parse headers into an object
	 *
	 * ```
	 * Date: Wed, 27 Aug 2014 08:58:49 GMT
	 * Content-Type: application/json
	 * Connection: keep-alive
	 * Transfer-Encoding: chunked
	 * ```
	 *
	 * @param {String} headers Headers needing to be parsed
	 * @returns {Object} Headers parsed into an object
	 */
	var parseHeaders = function parseHeaders(headers) {
	  var parsed = {};
	  var key;
	  var val;
	  var i;

	  if (!headers) { return parsed; }

	  utils.forEach(headers.split('\n'), function parser(line) {
	    i = line.indexOf(':');
	    key = utils.trim(line.substr(0, i)).toLowerCase();
	    val = utils.trim(line.substr(i + 1));

	    if (key) {
	      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
	        return;
	      }
	      if (key === 'set-cookie') {
	        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
	      } else {
	        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
	      }
	    }
	  });

	  return parsed;
	};

	var isURLSameOrigin = (
	  utils.isStandardBrowserEnv() ?

	  // Standard browser envs have full support of the APIs needed to test
	  // whether the request URL is of the same origin as current location.
	  (function standardBrowserEnv() {
	    var msie = /(msie|trident)/i.test(navigator.userAgent);
	    var urlParsingNode = document.createElement('a');
	    var originURL;

	    /**
	    * Parse a URL to discover it's components
	    *
	    * @param {String} url The URL to be parsed
	    * @returns {Object}
	    */
	    function resolveURL(url) {
	      var href = url;

	      if (msie) {
	        // IE needs attribute set twice to normalize properties
	        urlParsingNode.setAttribute('href', href);
	        href = urlParsingNode.href;
	      }

	      urlParsingNode.setAttribute('href', href);

	      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
	      return {
	        href: urlParsingNode.href,
	        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
	        host: urlParsingNode.host,
	        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
	        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
	        hostname: urlParsingNode.hostname,
	        port: urlParsingNode.port,
	        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
	                  urlParsingNode.pathname :
	                  '/' + urlParsingNode.pathname
	      };
	    }

	    originURL = resolveURL(window.location.href);

	    /**
	    * Determine if a URL shares the same origin as the current location
	    *
	    * @param {String} requestURL The URL to test
	    * @returns {boolean} True if URL shares the same origin, otherwise false
	    */
	    return function isURLSameOrigin(requestURL) {
	      var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
	      return (parsed.protocol === originURL.protocol &&
	            parsed.host === originURL.host);
	    };
	  })() :

	  // Non standard browser envs (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return function isURLSameOrigin() {
	      return true;
	    };
	  })()
	);

	var cookies = (
	  utils.isStandardBrowserEnv() ?

	  // Standard browser envs support document.cookie
	  (function standardBrowserEnv() {
	    return {
	      write: function write(name, value, expires, path, domain, secure) {
	        var cookie = [];
	        cookie.push(name + '=' + encodeURIComponent(value));

	        if (utils.isNumber(expires)) {
	          cookie.push('expires=' + new Date(expires).toGMTString());
	        }

	        if (utils.isString(path)) {
	          cookie.push('path=' + path);
	        }

	        if (utils.isString(domain)) {
	          cookie.push('domain=' + domain);
	        }

	        if (secure === true) {
	          cookie.push('secure');
	        }

	        document.cookie = cookie.join('; ');
	      },

	      read: function read(name) {
	        var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
	        return (match ? decodeURIComponent(match[3]) : null);
	      },

	      remove: function remove(name) {
	        this.write(name, '', Date.now() - 86400000);
	      }
	    };
	  })() :

	  // Non standard browser env (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return {
	      write: function write() {},
	      read: function read() { return null; },
	      remove: function remove() {}
	    };
	  })()
	);

	var xhr = function xhrAdapter(config) {
	  return new Promise(function dispatchXhrRequest(resolve, reject) {
	    var requestData = config.data;
	    var requestHeaders = config.headers;

	    if (utils.isFormData(requestData)) {
	      delete requestHeaders['Content-Type']; // Let the browser set it
	    }

	    var request = new XMLHttpRequest();

	    // HTTP basic authentication
	    if (config.auth) {
	      var username = config.auth.username || '';
	      var password = config.auth.password || '';
	      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
	    }

	    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

	    // Set the request timeout in MS
	    request.timeout = config.timeout;

	    // Listen for ready state
	    request.onreadystatechange = function handleLoad() {
	      if (!request || request.readyState !== 4) {
	        return;
	      }

	      // The request errored out and we didn't get a response, this will be
	      // handled by onerror instead
	      // With one exception: request that using file: protocol, most browsers
	      // will return status as 0 even though it's a successful request
	      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
	        return;
	      }

	      // Prepare the response
	      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
	      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
	      var response = {
	        data: responseData,
	        status: request.status,
	        statusText: request.statusText,
	        headers: responseHeaders,
	        config: config,
	        request: request
	      };

	      settle(resolve, reject, response);

	      // Clean up request
	      request = null;
	    };

	    // Handle low level network errors
	    request.onerror = function handleError() {
	      // Real errors are hidden from us by the browser
	      // onerror should only fire if it's a network error
	      reject(createError('Network Error', config, null, request));

	      // Clean up request
	      request = null;
	    };

	    // Handle timeout
	    request.ontimeout = function handleTimeout() {
	      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
	        request));

	      // Clean up request
	      request = null;
	    };

	    // Add xsrf header
	    // This is only done if running in a standard browser environment.
	    // Specifically not if we're in a web worker, or react-native.
	    if (utils.isStandardBrowserEnv()) {
	      var cookies$$1 = cookies;

	      // Add xsrf header
	      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
	          cookies$$1.read(config.xsrfCookieName) :
	          undefined;

	      if (xsrfValue) {
	        requestHeaders[config.xsrfHeaderName] = xsrfValue;
	      }
	    }

	    // Add headers to the request
	    if ('setRequestHeader' in request) {
	      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
	        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
	          // Remove Content-Type if data is undefined
	          delete requestHeaders[key];
	        } else {
	          // Otherwise add header to the request
	          request.setRequestHeader(key, val);
	        }
	      });
	    }

	    // Add withCredentials to request if needed
	    if (config.withCredentials) {
	      request.withCredentials = true;
	    }

	    // Add responseType to request if needed
	    if (config.responseType) {
	      try {
	        request.responseType = config.responseType;
	      } catch (e) {
	        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
	        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
	        if (config.responseType !== 'json') {
	          throw e;
	        }
	      }
	    }

	    // Handle progress if needed
	    if (typeof config.onDownloadProgress === 'function') {
	      request.addEventListener('progress', config.onDownloadProgress);
	    }

	    // Not all browsers support upload events
	    if (typeof config.onUploadProgress === 'function' && request.upload) {
	      request.upload.addEventListener('progress', config.onUploadProgress);
	    }

	    if (config.cancelToken) {
	      // Handle cancellation
	      config.cancelToken.promise.then(function onCanceled(cancel) {
	        if (!request) {
	          return;
	        }

	        request.abort();
	        reject(cancel);
	        // Clean up request
	        request = null;
	      });
	    }

	    if (requestData === undefined) {
	      requestData = null;
	    }

	    // Send the request
	    request.send(requestData);
	  });
	};

	var DEFAULT_CONTENT_TYPE = {
	  'Content-Type': 'application/x-www-form-urlencoded'
	};

	function setContentTypeIfUnset(headers, value) {
	  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
	    headers['Content-Type'] = value;
	  }
	}

	function getDefaultAdapter() {
	  var adapter;
	  if (typeof XMLHttpRequest !== 'undefined') {
	    // For browsers use XHR adapter
	    adapter = xhr;
	  } else if (typeof process !== 'undefined') {
	    // For node use HTTP adapter
	    adapter = xhr;
	  }
	  return adapter;
	}

	var defaults = {
	  adapter: getDefaultAdapter(),

	  transformRequest: [function transformRequest(data, headers) {
	    normalizeHeaderName(headers, 'Content-Type');
	    if (utils.isFormData(data) ||
	      utils.isArrayBuffer(data) ||
	      utils.isBuffer(data) ||
	      utils.isStream(data) ||
	      utils.isFile(data) ||
	      utils.isBlob(data)
	    ) {
	      return data;
	    }
	    if (utils.isArrayBufferView(data)) {
	      return data.buffer;
	    }
	    if (utils.isURLSearchParams(data)) {
	      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
	      return data.toString();
	    }
	    if (utils.isObject(data)) {
	      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
	      return JSON.stringify(data);
	    }
	    return data;
	  }],

	  transformResponse: [function transformResponse(data) {
	    /*eslint no-param-reassign:0*/
	    if (typeof data === 'string') {
	      try {
	        data = JSON.parse(data);
	      } catch (e) { /* Ignore */ }
	    }
	    return data;
	  }],

	  /**
	   * A timeout in milliseconds to abort a request. If set to 0 (default) a
	   * timeout is not created.
	   */
	  timeout: 0,

	  xsrfCookieName: 'XSRF-TOKEN',
	  xsrfHeaderName: 'X-XSRF-TOKEN',

	  maxContentLength: -1,

	  validateStatus: function validateStatus(status) {
	    return status >= 200 && status < 300;
	  }
	};

	defaults.headers = {
	  common: {
	    'Accept': 'application/json, text/plain, */*'
	  }
	};

	utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
	  defaults.headers[method] = {};
	});

	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
	});

	var defaults_1 = defaults;

	function InterceptorManager() {
	  this.handlers = [];
	}

	/**
	 * Add a new interceptor to the stack
	 *
	 * @param {Function} fulfilled The function to handle `then` for a `Promise`
	 * @param {Function} rejected The function to handle `reject` for a `Promise`
	 *
	 * @return {Number} An ID used to remove interceptor later
	 */
	InterceptorManager.prototype.use = function use(fulfilled, rejected) {
	  this.handlers.push({
	    fulfilled: fulfilled,
	    rejected: rejected
	  });
	  return this.handlers.length - 1;
	};

	/**
	 * Remove an interceptor from the stack
	 *
	 * @param {Number} id The ID that was returned by `use`
	 */
	InterceptorManager.prototype.eject = function eject(id) {
	  if (this.handlers[id]) {
	    this.handlers[id] = null;
	  }
	};

	/**
	 * Iterate over all the registered interceptors
	 *
	 * This method is particularly useful for skipping over any
	 * interceptors that may have become `null` calling `eject`.
	 *
	 * @param {Function} fn The function to call for each interceptor
	 */
	InterceptorManager.prototype.forEach = function forEach(fn) {
	  utils.forEach(this.handlers, function forEachHandler(h) {
	    if (h !== null) {
	      fn(h);
	    }
	  });
	};

	var InterceptorManager_1 = InterceptorManager;

	/**
	 * Transform the data for a request or a response
	 *
	 * @param {Object|String} data The data to be transformed
	 * @param {Array} headers The headers for the request or response
	 * @param {Array|Function} fns A single function or Array of functions
	 * @returns {*} The resulting transformed data
	 */
	var transformData = function transformData(data, headers, fns) {
	  /*eslint no-param-reassign:0*/
	  utils.forEach(fns, function transform(fn) {
	    data = fn(data, headers);
	  });

	  return data;
	};

	var isCancel = function isCancel(value) {
	  return !!(value && value.__CANCEL__);
	};

	/**
	 * Determines whether the specified URL is absolute
	 *
	 * @param {string} url The URL to test
	 * @returns {boolean} True if the specified URL is absolute, otherwise false
	 */
	var isAbsoluteURL = function isAbsoluteURL(url) {
	  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
	  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
	  // by any combination of letters, digits, plus, period, or hyphen.
	  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
	};

	/**
	 * Creates a new URL by combining the specified URLs
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} relativeURL The relative URL
	 * @returns {string} The combined URL
	 */
	var combineURLs = function combineURLs(baseURL, relativeURL) {
	  return relativeURL
	    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
	    : baseURL;
	};

	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	function throwIfCancellationRequested(config) {
	  if (config.cancelToken) {
	    config.cancelToken.throwIfRequested();
	  }
	}

	/**
	 * Dispatch a request to the server using the configured adapter.
	 *
	 * @param {object} config The config that is to be used for the request
	 * @returns {Promise} The Promise to be fulfilled
	 */
	var dispatchRequest = function dispatchRequest(config) {
	  throwIfCancellationRequested(config);

	  // Support baseURL config
	  if (config.baseURL && !isAbsoluteURL(config.url)) {
	    config.url = combineURLs(config.baseURL, config.url);
	  }

	  // Ensure headers exist
	  config.headers = config.headers || {};

	  // Transform request data
	  config.data = transformData(
	    config.data,
	    config.headers,
	    config.transformRequest
	  );

	  // Flatten headers
	  config.headers = utils.merge(
	    config.headers.common || {},
	    config.headers[config.method] || {},
	    config.headers || {}
	  );

	  utils.forEach(
	    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
	    function cleanHeaderConfig(method) {
	      delete config.headers[method];
	    }
	  );

	  var adapter = config.adapter || defaults_1.adapter;

	  return adapter(config).then(function onAdapterResolution(response) {
	    throwIfCancellationRequested(config);

	    // Transform response data
	    response.data = transformData(
	      response.data,
	      response.headers,
	      config.transformResponse
	    );

	    return response;
	  }, function onAdapterRejection(reason) {
	    if (!isCancel(reason)) {
	      throwIfCancellationRequested(config);

	      // Transform response data
	      if (reason && reason.response) {
	        reason.response.data = transformData(
	          reason.response.data,
	          reason.response.headers,
	          config.transformResponse
	        );
	      }
	    }

	    return Promise.reject(reason);
	  });
	};

	/**
	 * Create a new instance of Axios
	 *
	 * @param {Object} instanceConfig The default config for the instance
	 */
	function Axios(instanceConfig) {
	  this.defaults = instanceConfig;
	  this.interceptors = {
	    request: new InterceptorManager_1(),
	    response: new InterceptorManager_1()
	  };
	}

	/**
	 * Dispatch a request
	 *
	 * @param {Object} config The config specific for this request (merged with this.defaults)
	 */
	Axios.prototype.request = function request(config) {
	  /*eslint no-param-reassign:0*/
	  // Allow for axios('example/url'[, config]) a la fetch API
	  if (typeof config === 'string') {
	    config = utils.merge({
	      url: arguments[0]
	    }, arguments[1]);
	  }

	  config = utils.merge(defaults_1, {method: 'get'}, this.defaults, config);
	  config.method = config.method.toLowerCase();

	  // Hook up interceptors middleware
	  var chain = [dispatchRequest, undefined];
	  var promise = Promise.resolve(config);

	  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
	    chain.unshift(interceptor.fulfilled, interceptor.rejected);
	  });

	  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
	    chain.push(interceptor.fulfilled, interceptor.rejected);
	  });

	  while (chain.length) {
	    promise = promise.then(chain.shift(), chain.shift());
	  }

	  return promise;
	};

	// Provide aliases for supported request methods
	utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url
	    }));
	  };
	});

	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, data, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url,
	      data: data
	    }));
	  };
	});

	var Axios_1 = Axios;

	/**
	 * A `Cancel` is an object that is thrown when an operation is canceled.
	 *
	 * @class
	 * @param {string=} message The message.
	 */
	function Cancel(message) {
	  this.message = message;
	}

	Cancel.prototype.toString = function toString() {
	  return 'Cancel' + (this.message ? ': ' + this.message : '');
	};

	Cancel.prototype.__CANCEL__ = true;

	var Cancel_1 = Cancel;

	/**
	 * A `CancelToken` is an object that can be used to request cancellation of an operation.
	 *
	 * @class
	 * @param {Function} executor The executor function.
	 */
	function CancelToken(executor) {
	  if (typeof executor !== 'function') {
	    throw new TypeError('executor must be a function.');
	  }

	  var resolvePromise;
	  this.promise = new Promise(function promiseExecutor(resolve) {
	    resolvePromise = resolve;
	  });

	  var token = this;
	  executor(function cancel(message) {
	    if (token.reason) {
	      // Cancellation has already been requested
	      return;
	    }

	    token.reason = new Cancel_1(message);
	    resolvePromise(token.reason);
	  });
	}

	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	CancelToken.prototype.throwIfRequested = function throwIfRequested() {
	  if (this.reason) {
	    throw this.reason;
	  }
	};

	/**
	 * Returns an object that contains a new `CancelToken` and a function that, when called,
	 * cancels the `CancelToken`.
	 */
	CancelToken.source = function source() {
	  var cancel;
	  var token = new CancelToken(function executor(c) {
	    cancel = c;
	  });
	  return {
	    token: token,
	    cancel: cancel
	  };
	};

	var CancelToken_1 = CancelToken;

	/**
	 * Syntactic sugar for invoking a function and expanding an array for arguments.
	 *
	 * Common use case would be to use `Function.prototype.apply`.
	 *
	 *  ```js
	 *  function f(x, y, z) {}
	 *  var args = [1, 2, 3];
	 *  f.apply(null, args);
	 *  ```
	 *
	 * With `spread` this example can be re-written.
	 *
	 *  ```js
	 *  spread(function(x, y, z) {})([1, 2, 3]);
	 *  ```
	 *
	 * @param {Function} callback
	 * @returns {Function}
	 */
	var spread = function spread(callback) {
	  return function wrap(arr) {
	    return callback.apply(null, arr);
	  };
	};

	/**
	 * Create an instance of Axios
	 *
	 * @param {Object} defaultConfig The default config for the instance
	 * @return {Axios} A new instance of Axios
	 */
	function createInstance(defaultConfig) {
	  var context = new Axios_1(defaultConfig);
	  var instance = bind(Axios_1.prototype.request, context);

	  // Copy axios.prototype to instance
	  utils.extend(instance, Axios_1.prototype, context);

	  // Copy context to instance
	  utils.extend(instance, context);

	  return instance;
	}

	// Create the default instance to be exported
	var axios = createInstance(defaults_1);

	// Expose Axios class to allow class inheritance
	axios.Axios = Axios_1;

	// Factory for creating new instances
	axios.create = function create(instanceConfig) {
	  return createInstance(utils.merge(defaults_1, instanceConfig));
	};

	// Expose Cancel & CancelToken
	axios.Cancel = Cancel_1;
	axios.CancelToken = CancelToken_1;
	axios.isCancel = isCancel;

	// Expose all/spread
	axios.all = function all(promises) {
	  return Promise.all(promises);
	};
	axios.spread = spread;

	var axios_1 = axios;

	// Allow use of default import syntax in TypeScript
	var default_1 = axios;
	axios_1.default = default_1;

	var axios$1 = axios_1;

	var iterator = function (Yallist) {
	  Yallist.prototype[Symbol.iterator] = function* () {
	    for (let walker = this.head; walker; walker = walker.next) {
	      yield walker.value;
	    }
	  };
	};

	var yallist = Yallist;

	Yallist.Node = Node;
	Yallist.create = Yallist;

	function Yallist (list) {
	  var self = this;
	  if (!(self instanceof Yallist)) {
	    self = new Yallist();
	  }

	  self.tail = null;
	  self.head = null;
	  self.length = 0;

	  if (list && typeof list.forEach === 'function') {
	    list.forEach(function (item) {
	      self.push(item);
	    });
	  } else if (arguments.length > 0) {
	    for (var i = 0, l = arguments.length; i < l; i++) {
	      self.push(arguments[i]);
	    }
	  }

	  return self
	}

	Yallist.prototype.removeNode = function (node) {
	  if (node.list !== this) {
	    throw new Error('removing node which does not belong to this list')
	  }

	  var next = node.next;
	  var prev = node.prev;

	  if (next) {
	    next.prev = prev;
	  }

	  if (prev) {
	    prev.next = next;
	  }

	  if (node === this.head) {
	    this.head = next;
	  }
	  if (node === this.tail) {
	    this.tail = prev;
	  }

	  node.list.length--;
	  node.next = null;
	  node.prev = null;
	  node.list = null;

	  return next
	};

	Yallist.prototype.unshiftNode = function (node) {
	  if (node === this.head) {
	    return
	  }

	  if (node.list) {
	    node.list.removeNode(node);
	  }

	  var head = this.head;
	  node.list = this;
	  node.next = head;
	  if (head) {
	    head.prev = node;
	  }

	  this.head = node;
	  if (!this.tail) {
	    this.tail = node;
	  }
	  this.length++;
	};

	Yallist.prototype.pushNode = function (node) {
	  if (node === this.tail) {
	    return
	  }

	  if (node.list) {
	    node.list.removeNode(node);
	  }

	  var tail = this.tail;
	  node.list = this;
	  node.prev = tail;
	  if (tail) {
	    tail.next = node;
	  }

	  this.tail = node;
	  if (!this.head) {
	    this.head = node;
	  }
	  this.length++;
	};

	Yallist.prototype.push = function () {
	  for (var i = 0, l = arguments.length; i < l; i++) {
	    push(this, arguments[i]);
	  }
	  return this.length
	};

	Yallist.prototype.unshift = function () {
	  for (var i = 0, l = arguments.length; i < l; i++) {
	    unshift(this, arguments[i]);
	  }
	  return this.length
	};

	Yallist.prototype.pop = function () {
	  if (!this.tail) {
	    return undefined
	  }

	  var res = this.tail.value;
	  this.tail = this.tail.prev;
	  if (this.tail) {
	    this.tail.next = null;
	  } else {
	    this.head = null;
	  }
	  this.length--;
	  return res
	};

	Yallist.prototype.shift = function () {
	  if (!this.head) {
	    return undefined
	  }

	  var res = this.head.value;
	  this.head = this.head.next;
	  if (this.head) {
	    this.head.prev = null;
	  } else {
	    this.tail = null;
	  }
	  this.length--;
	  return res
	};

	Yallist.prototype.forEach = function (fn, thisp) {
	  thisp = thisp || this;
	  for (var walker = this.head, i = 0; walker !== null; i++) {
	    fn.call(thisp, walker.value, i, this);
	    walker = walker.next;
	  }
	};

	Yallist.prototype.forEachReverse = function (fn, thisp) {
	  thisp = thisp || this;
	  for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
	    fn.call(thisp, walker.value, i, this);
	    walker = walker.prev;
	  }
	};

	Yallist.prototype.get = function (n) {
	  for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
	    // abort out of the list early if we hit a cycle
	    walker = walker.next;
	  }
	  if (i === n && walker !== null) {
	    return walker.value
	  }
	};

	Yallist.prototype.getReverse = function (n) {
	  for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
	    // abort out of the list early if we hit a cycle
	    walker = walker.prev;
	  }
	  if (i === n && walker !== null) {
	    return walker.value
	  }
	};

	Yallist.prototype.map = function (fn, thisp) {
	  thisp = thisp || this;
	  var res = new Yallist();
	  for (var walker = this.head; walker !== null;) {
	    res.push(fn.call(thisp, walker.value, this));
	    walker = walker.next;
	  }
	  return res
	};

	Yallist.prototype.mapReverse = function (fn, thisp) {
	  thisp = thisp || this;
	  var res = new Yallist();
	  for (var walker = this.tail; walker !== null;) {
	    res.push(fn.call(thisp, walker.value, this));
	    walker = walker.prev;
	  }
	  return res
	};

	Yallist.prototype.reduce = function (fn, initial) {
	  var acc;
	  var walker = this.head;
	  if (arguments.length > 1) {
	    acc = initial;
	  } else if (this.head) {
	    walker = this.head.next;
	    acc = this.head.value;
	  } else {
	    throw new TypeError('Reduce of empty list with no initial value')
	  }

	  for (var i = 0; walker !== null; i++) {
	    acc = fn(acc, walker.value, i);
	    walker = walker.next;
	  }

	  return acc
	};

	Yallist.prototype.reduceReverse = function (fn, initial) {
	  var acc;
	  var walker = this.tail;
	  if (arguments.length > 1) {
	    acc = initial;
	  } else if (this.tail) {
	    walker = this.tail.prev;
	    acc = this.tail.value;
	  } else {
	    throw new TypeError('Reduce of empty list with no initial value')
	  }

	  for (var i = this.length - 1; walker !== null; i--) {
	    acc = fn(acc, walker.value, i);
	    walker = walker.prev;
	  }

	  return acc
	};

	Yallist.prototype.toArray = function () {
	  var arr = new Array(this.length);
	  for (var i = 0, walker = this.head; walker !== null; i++) {
	    arr[i] = walker.value;
	    walker = walker.next;
	  }
	  return arr
	};

	Yallist.prototype.toArrayReverse = function () {
	  var arr = new Array(this.length);
	  for (var i = 0, walker = this.tail; walker !== null; i++) {
	    arr[i] = walker.value;
	    walker = walker.prev;
	  }
	  return arr
	};

	Yallist.prototype.slice = function (from, to) {
	  to = to || this.length;
	  if (to < 0) {
	    to += this.length;
	  }
	  from = from || 0;
	  if (from < 0) {
	    from += this.length;
	  }
	  var ret = new Yallist();
	  if (to < from || to < 0) {
	    return ret
	  }
	  if (from < 0) {
	    from = 0;
	  }
	  if (to > this.length) {
	    to = this.length;
	  }
	  for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
	    walker = walker.next;
	  }
	  for (; walker !== null && i < to; i++, walker = walker.next) {
	    ret.push(walker.value);
	  }
	  return ret
	};

	Yallist.prototype.sliceReverse = function (from, to) {
	  to = to || this.length;
	  if (to < 0) {
	    to += this.length;
	  }
	  from = from || 0;
	  if (from < 0) {
	    from += this.length;
	  }
	  var ret = new Yallist();
	  if (to < from || to < 0) {
	    return ret
	  }
	  if (from < 0) {
	    from = 0;
	  }
	  if (to > this.length) {
	    to = this.length;
	  }
	  for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
	    walker = walker.prev;
	  }
	  for (; walker !== null && i > from; i--, walker = walker.prev) {
	    ret.push(walker.value);
	  }
	  return ret
	};

	Yallist.prototype.splice = function (start, deleteCount /*, ...nodes */) {
	  if (start > this.length) {
	    start = this.length - 1;
	  }
	  if (start < 0) {
	    start = this.length + start;
	  }

	  for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
	    walker = walker.next;
	  }

	  var ret = [];
	  for (var i = 0; walker && i < deleteCount; i++) {
	    ret.push(walker.value);
	    walker = this.removeNode(walker);
	  }
	  if (walker === null) {
	    walker = this.tail;
	  }

	  if (walker !== this.head && walker !== this.tail) {
	    walker = walker.prev;
	  }

	  for (var i = 2; i < arguments.length; i++) {
	    walker = insert(this, walker, arguments[i]);
	  }
	  return ret;
	};

	Yallist.prototype.reverse = function () {
	  var head = this.head;
	  var tail = this.tail;
	  for (var walker = head; walker !== null; walker = walker.prev) {
	    var p = walker.prev;
	    walker.prev = walker.next;
	    walker.next = p;
	  }
	  this.head = tail;
	  this.tail = head;
	  return this
	};

	function insert (self, node, value) {
	  var inserted = node === self.head ?
	    new Node(value, null, node, self) :
	    new Node(value, node, node.next, self);

	  if (inserted.next === null) {
	    self.tail = inserted;
	  }
	  if (inserted.prev === null) {
	    self.head = inserted;
	  }

	  self.length++;

	  return inserted
	}

	function push (self, item) {
	  self.tail = new Node(item, self.tail, null, self);
	  if (!self.head) {
	    self.head = self.tail;
	  }
	  self.length++;
	}

	function unshift (self, item) {
	  self.head = new Node(item, null, self.head, self);
	  if (!self.tail) {
	    self.tail = self.head;
	  }
	  self.length++;
	}

	function Node (value, prev, next, list) {
	  if (!(this instanceof Node)) {
	    return new Node(value, prev, next, list)
	  }

	  this.list = list;
	  this.value = value;

	  if (prev) {
	    prev.next = this;
	    this.prev = prev;
	  } else {
	    this.prev = null;
	  }

	  if (next) {
	    next.prev = this;
	    this.next = next;
	  } else {
	    this.next = null;
	  }
	}

	try {
	  // add if support for Symbol.iterator is present
	  iterator(Yallist);
	} catch (er) {}

	// A linked list to keep track of recently-used-ness


	const MAX = Symbol('max');
	const LENGTH = Symbol('length');
	const LENGTH_CALCULATOR = Symbol('lengthCalculator');
	const ALLOW_STALE = Symbol('allowStale');
	const MAX_AGE = Symbol('maxAge');
	const DISPOSE = Symbol('dispose');
	const NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet');
	const LRU_LIST = Symbol('lruList');
	const CACHE = Symbol('cache');
	const UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet');

	const naiveLength = () => 1;

	// lruList is a yallist where the head is the youngest
	// item, and the tail is the oldest.  the list contains the Hit
	// objects as the entries.
	// Each Hit object has a reference to its Yallist.Node.  This
	// never changes.
	//
	// cache is a Map (or PseudoMap) that matches the keys to
	// the Yallist.Node object.
	class LRUCache {
	  constructor (options) {
	    if (typeof options === 'number')
	      options = { max: options };

	    if (!options)
	      options = {};

	    if (options.max && (typeof options.max !== 'number' || options.max < 0))
	      throw new TypeError('max must be a non-negative number')
	    // Kind of weird to have a default max of Infinity, but oh well.
	    const max = this[MAX] = options.max || Infinity;

	    const lc = options.length || naiveLength;
	    this[LENGTH_CALCULATOR] = (typeof lc !== 'function') ? naiveLength : lc;
	    this[ALLOW_STALE] = options.stale || false;
	    if (options.maxAge && typeof options.maxAge !== 'number')
	      throw new TypeError('maxAge must be a number')
	    this[MAX_AGE] = options.maxAge || 0;
	    this[DISPOSE] = options.dispose;
	    this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
	    this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
	    this.reset();
	  }

	  // resize the cache when the max changes.
	  set max (mL) {
	    if (typeof mL !== 'number' || mL < 0)
	      throw new TypeError('max must be a non-negative number')

	    this[MAX] = mL || Infinity;
	    trim$1(this);
	  }
	  get max () {
	    return this[MAX]
	  }

	  set allowStale (allowStale) {
	    this[ALLOW_STALE] = !!allowStale;
	  }
	  get allowStale () {
	    return this[ALLOW_STALE]
	  }

	  set maxAge (mA) {
	    if (typeof mA !== 'number')
	      throw new TypeError('maxAge must be a non-negative number')

	    this[MAX_AGE] = mA;
	    trim$1(this);
	  }
	  get maxAge () {
	    return this[MAX_AGE]
	  }

	  // resize the cache when the lengthCalculator changes.
	  set lengthCalculator (lC) {
	    if (typeof lC !== 'function')
	      lC = naiveLength;

	    if (lC !== this[LENGTH_CALCULATOR]) {
	      this[LENGTH_CALCULATOR] = lC;
	      this[LENGTH] = 0;
	      this[LRU_LIST].forEach(hit => {
	        hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key);
	        this[LENGTH] += hit.length;
	      });
	    }
	    trim$1(this);
	  }
	  get lengthCalculator () { return this[LENGTH_CALCULATOR] }

	  get length () { return this[LENGTH] }
	  get itemCount () { return this[LRU_LIST].length }

	  rforEach (fn, thisp) {
	    thisp = thisp || this;
	    for (let walker = this[LRU_LIST].tail; walker !== null;) {
	      const prev = walker.prev;
	      forEachStep(this, fn, walker, thisp);
	      walker = prev;
	    }
	  }

	  forEach (fn, thisp) {
	    thisp = thisp || this;
	    for (let walker = this[LRU_LIST].head; walker !== null;) {
	      const next = walker.next;
	      forEachStep(this, fn, walker, thisp);
	      walker = next;
	    }
	  }

	  keys () {
	    return this[LRU_LIST].toArray().map(k => k.key)
	  }

	  values () {
	    return this[LRU_LIST].toArray().map(k => k.value)
	  }

	  reset () {
	    if (this[DISPOSE] &&
	        this[LRU_LIST] &&
	        this[LRU_LIST].length) {
	      this[LRU_LIST].forEach(hit => this[DISPOSE](hit.key, hit.value));
	    }

	    this[CACHE] = new Map(); // hash of items by key
	    this[LRU_LIST] = new yallist(); // list of items in order of use recency
	    this[LENGTH] = 0; // length of items in the list
	  }

	  dump () {
	    return this[LRU_LIST].map(hit =>
	      isStale(this, hit) ? false : {
	        k: hit.key,
	        v: hit.value,
	        e: hit.now + (hit.maxAge || 0)
	      }).toArray().filter(h => h)
	  }

	  dumpLru () {
	    return this[LRU_LIST]
	  }

	  set (key, value, maxAge) {
	    maxAge = maxAge || this[MAX_AGE];

	    if (maxAge && typeof maxAge !== 'number')
	      throw new TypeError('maxAge must be a number')

	    const now = maxAge ? Date.now() : 0;
	    const len = this[LENGTH_CALCULATOR](value, key);

	    if (this[CACHE].has(key)) {
	      if (len > this[MAX]) {
	        del(this, this[CACHE].get(key));
	        return false
	      }

	      const node = this[CACHE].get(key);
	      const item = node.value;

	      // dispose of the old one before overwriting
	      // split out into 2 ifs for better coverage tracking
	      if (this[DISPOSE]) {
	        if (!this[NO_DISPOSE_ON_SET])
	          this[DISPOSE](key, item.value);
	      }

	      item.now = now;
	      item.maxAge = maxAge;
	      item.value = value;
	      this[LENGTH] += len - item.length;
	      item.length = len;
	      this.get(key);
	      trim$1(this);
	      return true
	    }

	    const hit = new Entry(key, value, len, now, maxAge);

	    // oversized objects fall out of cache automatically.
	    if (hit.length > this[MAX]) {
	      if (this[DISPOSE])
	        this[DISPOSE](key, value);

	      return false
	    }

	    this[LENGTH] += hit.length;
	    this[LRU_LIST].unshift(hit);
	    this[CACHE].set(key, this[LRU_LIST].head);
	    trim$1(this);
	    return true
	  }

	  has (key) {
	    if (!this[CACHE].has(key)) return false
	    const hit = this[CACHE].get(key).value;
	    return !isStale(this, hit)
	  }

	  get (key) {
	    return get(this, key, true)
	  }

	  peek (key) {
	    return get(this, key, false)
	  }

	  pop () {
	    const node = this[LRU_LIST].tail;
	    if (!node)
	      return null

	    del(this, node);
	    return node.value
	  }

	  del (key) {
	    del(this, this[CACHE].get(key));
	  }

	  load (arr) {
	    // reset the cache
	    this.reset();

	    const now = Date.now();
	    // A previous serialized cache has the most recent items first
	    for (let l = arr.length - 1; l >= 0; l--) {
	      const hit = arr[l];
	      const expiresAt = hit.e || 0;
	      if (expiresAt === 0)
	        // the item was created without expiration in a non aged cache
	        this.set(hit.k, hit.v);
	      else {
	        const maxAge = expiresAt - now;
	        // dont add already expired items
	        if (maxAge > 0) {
	          this.set(hit.k, hit.v, maxAge);
	        }
	      }
	    }
	  }

	  prune () {
	    this[CACHE].forEach((value, key) => get(this, key, false));
	  }
	}

	const get = (self, key, doUse) => {
	  const node = self[CACHE].get(key);
	  if (node) {
	    const hit = node.value;
	    if (isStale(self, hit)) {
	      del(self, node);
	      if (!self[ALLOW_STALE])
	        return undefined
	    } else {
	      if (doUse) {
	        if (self[UPDATE_AGE_ON_GET])
	          node.value.now = Date.now();
	        self[LRU_LIST].unshiftNode(node);
	      }
	    }
	    return hit.value
	  }
	};

	const isStale = (self, hit) => {
	  if (!hit || (!hit.maxAge && !self[MAX_AGE]))
	    return false

	  const diff = Date.now() - hit.now;
	  return hit.maxAge ? diff > hit.maxAge
	    : self[MAX_AGE] && (diff > self[MAX_AGE])
	};

	const trim$1 = self => {
	  if (self[LENGTH] > self[MAX]) {
	    for (let walker = self[LRU_LIST].tail;
	      self[LENGTH] > self[MAX] && walker !== null;) {
	      // We know that we're about to delete this one, and also
	      // what the next least recently used key will be, so just
	      // go ahead and set it now.
	      const prev = walker.prev;
	      del(self, walker);
	      walker = prev;
	    }
	  }
	};

	const del = (self, node) => {
	  if (node) {
	    const hit = node.value;
	    if (self[DISPOSE])
	      self[DISPOSE](hit.key, hit.value);

	    self[LENGTH] -= hit.length;
	    self[CACHE].delete(hit.key);
	    self[LRU_LIST].removeNode(node);
	  }
	};

	class Entry {
	  constructor (key, value, length, now, maxAge) {
	    this.key = key;
	    this.value = value;
	    this.length = length;
	    this.now = now;
	    this.maxAge = maxAge || 0;
	  }
	}

	const forEachStep = (self, fn, node, thisp) => {
	  let hit = node.value;
	  if (isStale(self, hit)) {
	    del(self, node);
	    if (!self[ALLOW_STALE])
	      hit = undefined;
	  }
	  if (hit)
	    fn.call(thisp, hit.value, hit.key, self);
	};

	var lruCache = LRUCache;

	/*! *****************************************************************************
	Copyright (c) Microsoft Corporation.

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */

	function __awaiter(thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	}

	function __generator(thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [op[0] & 2, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	}

	/**
	 * @author Kuitos
	 * @homepage https://github.com/kuitos/
	 * @since 2017-10-12
	 */
	function buildSortedURL() {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i] = arguments[_i];
	    }
	    var builtURL = buildURL.apply(void 0, args);
	    var _a = builtURL.split('?'), urlPath = _a[0], queryString = _a[1];
	    if (queryString) {
	        var paramsPair = queryString.split('&');
	        return urlPath + "?" + paramsPair.sort().join('&');
	    }
	    return builtURL;
	}

	/**
	 * @author Kuitos
	 * @homepage https://github.com/kuitos/
	 * @since 2018-03-19
	 */
	function isCacheLike(cache) {
	    return !!(cache.set && cache.get && cache.del &&
	        typeof cache.get === 'function' && typeof cache.set === 'function' && typeof cache.del === 'function');
	}

	var FIVE_MINUTES = 1000 * 60 * 5;
	var CAPACITY = 100;
	function cacheAdapterEnhancer(adapter, options) {
	    var _this = this;
	    if (options === void 0) { options = {}; }
	    var _a = options.enabledByDefault, enabledByDefault = _a === void 0 ? true : _a, _b = options.cacheFlag, cacheFlag = _b === void 0 ? 'cache' : _b, _c = options.defaultCache, defaultCache = _c === void 0 ? new lruCache({ maxAge: FIVE_MINUTES, max: CAPACITY }) : _c;
	    return function (config$$1) {
	        var url = config$$1.url, method = config$$1.method, params = config$$1.params, paramsSerializer = config$$1.paramsSerializer, forceUpdate = config$$1.forceUpdate;
	        var useCache = (config$$1[cacheFlag] !== void 0 && config$$1[cacheFlag] !== null)
	            ? config$$1[cacheFlag]
	            : enabledByDefault;
	        if (method === 'get' && useCache) {
	            // if had provide a specified cache, then use it instead
	            var cache_1 = isCacheLike(useCache) ? useCache : defaultCache;
	            // build the index according to the url and params
	            var index_1 = buildSortedURL(url, params, paramsSerializer);
	            var responsePromise = cache_1.get(index_1);
	            if (!responsePromise || forceUpdate) {
	                responsePromise = (function () { return __awaiter(_this, void 0, void 0, function () {
	                    var reason_1;
	                    return __generator(this, function (_a) {
	                        switch (_a.label) {
	                            case 0:
	                                _a.trys.push([0, 2, , 3]);
	                                return [4 /*yield*/, adapter(config$$1)];
	                            case 1: return [2 /*return*/, _a.sent()];
	                            case 2:
	                                reason_1 = _a.sent();
	                                cache_1.del(index_1);
	                                throw reason_1;
	                            case 3: return [2 /*return*/];
	                        }
	                    });
	                }); })();
	                // put the promise for the non-transformed response into cache as a placeholder
	                cache_1.set(index_1, responsePromise);
	                return responsePromise;
	            }
	            return responsePromise;
	        }
	        return adapter(config$$1);
	    };
	}

	/**
	 * @author Kuitos
	 * @homepage https://github.com/kuitos/
	 * @since 2017-09-28
	 */

	var elasticlunr_min = createCommonjsModule(function (module, exports) {
	/**
	 * elasticlunr - http://weixsong.github.io
	 * Lightweight full-text search engine in Javascript for browser search and offline search. - 0.9.5
	 *
	 * Copyright (C) 2016 Oliver Nightingale
	 * Copyright (C) 2016 Wei Song
	 * MIT Licensed
	 * @license
	 */
	!function(){function e(e){if(null===e||"object"!=typeof e)return e;var t=e.constructor();for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t}var t=function(e){var n=new t.Index;return n.pipeline.add(t.trimmer,t.stopWordFilter,t.stemmer),e&&e.call(n,n),n};t.version="0.9.5",lunr=t,t.utils={},t.utils.warn=function(e){return function(t){e.console&&console.warn&&console.warn(t);}}(this),t.utils.toString=function(e){return void 0===e||null===e?"":e.toString()},t.EventEmitter=function(){this.events={};},t.EventEmitter.prototype.addListener=function(){var e=Array.prototype.slice.call(arguments),t=e.pop(),n=e;if("function"!=typeof t)throw new TypeError("last argument must be a function");n.forEach(function(e){this.hasHandler(e)||(this.events[e]=[]),this.events[e].push(t);},this);},t.EventEmitter.prototype.removeListener=function(e,t){if(this.hasHandler(e)){var n=this.events[e].indexOf(t);-1!==n&&(this.events[e].splice(n,1),0==this.events[e].length&&delete this.events[e]);}},t.EventEmitter.prototype.emit=function(e){if(this.hasHandler(e)){var t=Array.prototype.slice.call(arguments,1);this.events[e].forEach(function(e){e.apply(void 0,t);},this);}},t.EventEmitter.prototype.hasHandler=function(e){return e in this.events},t.tokenizer=function(e){if(!arguments.length||null===e||void 0===e)return [];if(Array.isArray(e)){var n=e.filter(function(e){return null===e||void 0===e?!1:!0});n=n.map(function(e){return t.utils.toString(e).toLowerCase()});var i=[];return n.forEach(function(e){var n=e.split(t.tokenizer.seperator);i=i.concat(n);},this),i}return e.toString().trim().toLowerCase().split(t.tokenizer.seperator)},t.tokenizer.defaultSeperator=/[\s\-]+/,t.tokenizer.seperator=t.tokenizer.defaultSeperator,t.tokenizer.setSeperator=function(e){null!==e&&void 0!==e&&"object"==typeof e&&(t.tokenizer.seperator=e);},t.tokenizer.resetSeperator=function(){t.tokenizer.seperator=t.tokenizer.defaultSeperator;},t.tokenizer.getSeperator=function(){return t.tokenizer.seperator},t.Pipeline=function(){this._queue=[];},t.Pipeline.registeredFunctions={},t.Pipeline.registerFunction=function(e,n){n in t.Pipeline.registeredFunctions&&t.utils.warn("Overwriting existing registered function: "+n),e.label=n,t.Pipeline.registeredFunctions[n]=e;},t.Pipeline.getRegisteredFunction=function(e){return e in t.Pipeline.registeredFunctions!=!0?null:t.Pipeline.registeredFunctions[e]},t.Pipeline.warnIfFunctionNotRegistered=function(e){var n=e.label&&e.label in this.registeredFunctions;n||t.utils.warn("Function is not registered with pipeline. This may cause problems when serialising the index.\n",e);},t.Pipeline.load=function(e){var n=new t.Pipeline;return e.forEach(function(e){var i=t.Pipeline.getRegisteredFunction(e);if(!i)throw new Error("Cannot load un-registered function: "+e);n.add(i);}),n},t.Pipeline.prototype.add=function(){var e=Array.prototype.slice.call(arguments);e.forEach(function(e){t.Pipeline.warnIfFunctionNotRegistered(e),this._queue.push(e);},this);},t.Pipeline.prototype.after=function(e,n){t.Pipeline.warnIfFunctionNotRegistered(n);var i=this._queue.indexOf(e);if(-1===i)throw new Error("Cannot find existingFn");this._queue.splice(i+1,0,n);},t.Pipeline.prototype.before=function(e,n){t.Pipeline.warnIfFunctionNotRegistered(n);var i=this._queue.indexOf(e);if(-1===i)throw new Error("Cannot find existingFn");this._queue.splice(i,0,n);},t.Pipeline.prototype.remove=function(e){var t=this._queue.indexOf(e);-1!==t&&this._queue.splice(t,1);},t.Pipeline.prototype.run=function(e){for(var t=[],n=e.length,i=this._queue.length,o=0;n>o;o++){for(var r=e[o],s=0;i>s&&(r=this._queue[s](r,o,e),void 0!==r&&null!==r);s++);void 0!==r&&null!==r&&t.push(r);}return t},t.Pipeline.prototype.reset=function(){this._queue=[];},t.Pipeline.prototype.get=function(){return this._queue},t.Pipeline.prototype.toJSON=function(){return this._queue.map(function(e){return t.Pipeline.warnIfFunctionNotRegistered(e),e.label})},t.Index=function(){this._fields=[],this._ref="id",this.pipeline=new t.Pipeline,this.documentStore=new t.DocumentStore,this.index={},this.eventEmitter=new t.EventEmitter,this._idfCache={},this.on("add","remove","update",function(){this._idfCache={};}.bind(this));},t.Index.prototype.on=function(){var e=Array.prototype.slice.call(arguments);return this.eventEmitter.addListener.apply(this.eventEmitter,e)},t.Index.prototype.off=function(e,t){return this.eventEmitter.removeListener(e,t)},t.Index.load=function(e){e.version!==t.version&&t.utils.warn("version mismatch: current "+t.version+" importing "+e.version);var n=new this;n._fields=e.fields,n._ref=e.ref,n.documentStore=t.DocumentStore.load(e.documentStore),n.pipeline=t.Pipeline.load(e.pipeline),n.index={};for(var i in e.index)n.index[i]=t.InvertedIndex.load(e.index[i]);return n},t.Index.prototype.addField=function(e){return this._fields.push(e),this.index[e]=new t.InvertedIndex,this},t.Index.prototype.setRef=function(e){return this._ref=e,this},t.Index.prototype.saveDocument=function(e){return this.documentStore=new t.DocumentStore(e),this},t.Index.prototype.addDoc=function(e,n){if(e){var n=void 0===n?!0:n,i=e[this._ref];this.documentStore.addDoc(i,e),this._fields.forEach(function(n){var o=this.pipeline.run(t.tokenizer(e[n]));this.documentStore.addFieldLength(i,n,o.length);var r={};o.forEach(function(e){e in r?r[e]+=1:r[e]=1;},this);for(var s in r){var u=r[s];u=Math.sqrt(u),this.index[n].addToken(s,{ref:i,tf:u});}},this),n&&this.eventEmitter.emit("add",e,this);}},t.Index.prototype.removeDocByRef=function(e){if(e&&this.documentStore.isDocStored()!==!1&&this.documentStore.hasDoc(e)){var t=this.documentStore.getDoc(e);this.removeDoc(t,!1);}},t.Index.prototype.removeDoc=function(e,n){if(e){var n=void 0===n?!0:n,i=e[this._ref];this.documentStore.hasDoc(i)&&(this.documentStore.removeDoc(i),this._fields.forEach(function(n){var o=this.pipeline.run(t.tokenizer(e[n]));o.forEach(function(e){this.index[n].removeToken(e,i);},this);},this),n&&this.eventEmitter.emit("remove",e,this));}},t.Index.prototype.updateDoc=function(e,t){var t=void 0===t?!0:t;this.removeDocByRef(e[this._ref],!1),this.addDoc(e,!1),t&&this.eventEmitter.emit("update",e,this);},t.Index.prototype.idf=function(e,t){var n="@"+t+"/"+e;if(Object.prototype.hasOwnProperty.call(this._idfCache,n))return this._idfCache[n];var i=this.index[t].getDocFreq(e),o=1+Math.log(this.documentStore.length/(i+1));return this._idfCache[n]=o,o},t.Index.prototype.getFields=function(){return this._fields.slice()},t.Index.prototype.search=function(e,n){if(!e)return [];var i=null;null!=n&&(i=JSON.stringify(n));var o=new t.Configuration(i,this.getFields()).get(),r=this.pipeline.run(t.tokenizer(e)),s={};for(var u in o){var a=this.fieldSearch(r,u,o),l=o[u].boost;for(var d in a)a[d]=a[d]*l;for(var d in a)d in s?s[d]+=a[d]:s[d]=a[d];}var c=[];for(var d in s)c.push({ref:d,score:s[d]});return c.sort(function(e,t){return t.score-e.score}),c},t.Index.prototype.fieldSearch=function(e,t,n){var i=n[t].bool,o=n[t].expand,r=n[t].boost,s=null,u={};return 0!==r?(e.forEach(function(e){var n=[e];1==o&&(n=this.index[t].expandToken(e));var r={};n.forEach(function(n){var o=this.index[t].getDocs(n),a=this.idf(n,t);if(s&&"AND"==i){var l={};for(var d in s)d in o&&(l[d]=o[d]);o=l;}n==e&&this.fieldSearchStats(u,n,o);for(var d in o){var c=this.index[t].getTermFrequency(n,d),f=this.documentStore.getFieldLength(d,t),h=1;0!=f&&(h=1/Math.sqrt(f));var p=1;n!=e&&(p=.15*(1-(n.length-e.length)/n.length));var v=c*a*h*p;d in r?r[d]+=v:r[d]=v;}},this),s=this.mergeScores(s,r,i);},this),s=this.coordNorm(s,u,e.length)):void 0},t.Index.prototype.mergeScores=function(e,t,n){if(!e)return t;if("AND"==n){var i={};for(var o in t)o in e&&(i[o]=e[o]+t[o]);return i}for(var o in t)o in e?e[o]+=t[o]:e[o]=t[o];return e},t.Index.prototype.fieldSearchStats=function(e,t,n){for(var i in n)i in e?e[i].push(t):e[i]=[t];},t.Index.prototype.coordNorm=function(e,t,n){for(var i in e)if(i in t){var o=t[i].length;e[i]=e[i]*o/n;}return e},t.Index.prototype.toJSON=function(){var e={};return this._fields.forEach(function(t){e[t]=this.index[t].toJSON();},this),{version:t.version,fields:this._fields,ref:this._ref,documentStore:this.documentStore.toJSON(),index:e,pipeline:this.pipeline.toJSON()}},t.Index.prototype.use=function(e){var t=Array.prototype.slice.call(arguments,1);t.unshift(this),e.apply(this,t);},t.DocumentStore=function(e){this._save=null===e||void 0===e?!0:e,this.docs={},this.docInfo={},this.length=0;},t.DocumentStore.load=function(e){var t=new this;return t.length=e.length,t.docs=e.docs,t.docInfo=e.docInfo,t._save=e.save,t},t.DocumentStore.prototype.isDocStored=function(){return this._save},t.DocumentStore.prototype.addDoc=function(t,n){this.hasDoc(t)||this.length++,this.docs[t]=this._save===!0?e(n):null;},t.DocumentStore.prototype.getDoc=function(e){return this.hasDoc(e)===!1?null:this.docs[e]},t.DocumentStore.prototype.hasDoc=function(e){return e in this.docs},t.DocumentStore.prototype.removeDoc=function(e){this.hasDoc(e)&&(delete this.docs[e],delete this.docInfo[e],this.length--);},t.DocumentStore.prototype.addFieldLength=function(e,t,n){null!==e&&void 0!==e&&0!=this.hasDoc(e)&&(this.docInfo[e]||(this.docInfo[e]={}),this.docInfo[e][t]=n);},t.DocumentStore.prototype.updateFieldLength=function(e,t,n){null!==e&&void 0!==e&&0!=this.hasDoc(e)&&this.addFieldLength(e,t,n);},t.DocumentStore.prototype.getFieldLength=function(e,t){return null===e||void 0===e?0:e in this.docs&&t in this.docInfo[e]?this.docInfo[e][t]:0},t.DocumentStore.prototype.toJSON=function(){return {docs:this.docs,docInfo:this.docInfo,length:this.length,save:this._save}},t.stemmer=function(){var e={ational:"ate",tional:"tion",enci:"ence",anci:"ance",izer:"ize",bli:"ble",alli:"al",entli:"ent",eli:"e",ousli:"ous",ization:"ize",ation:"ate",ator:"ate",alism:"al",iveness:"ive",fulness:"ful",ousness:"ous",aliti:"al",iviti:"ive",biliti:"ble",logi:"log"},t={icate:"ic",ative:"",alize:"al",iciti:"ic",ical:"ic",ful:"",ness:""},n="[^aeiou]",i="[aeiouy]",o=n+"[^aeiouy]*",r=i+"[aeiou]*",s="^("+o+")?"+r+o,u="^("+o+")?"+r+o+"("+r+")?$",a="^("+o+")?"+r+o+r+o,l="^("+o+")?"+i,d=new RegExp(s),c=new RegExp(a),f=new RegExp(u),h=new RegExp(l),p=/^(.+?)(ss|i)es$/,v=/^(.+?)([^s])s$/,g=/^(.+?)eed$/,m=/^(.+?)(ed|ing)$/,y=/.$/,S=/(at|bl|iz)$/,x=new RegExp("([^aeiouylsz])\\1$"),w=new RegExp("^"+o+i+"[^aeiouwxy]$"),I=/^(.+?[^aeiou])y$/,b=/^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/,E=/^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/,D=/^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/,F=/^(.+?)(s|t)(ion)$/,_=/^(.+?)e$/,P=/ll$/,k=new RegExp("^"+o+i+"[^aeiouwxy]$"),z=function(n){var i,o,r,s,u,a,l;if(n.length<3)return n;if(r=n.substr(0,1),"y"==r&&(n=r.toUpperCase()+n.substr(1)),s=p,u=v,s.test(n)?n=n.replace(s,"$1$2"):u.test(n)&&(n=n.replace(u,"$1$2")),s=g,u=m,s.test(n)){var z=s.exec(n);s=d,s.test(z[1])&&(s=y,n=n.replace(s,""));}else if(u.test(n)){var z=u.exec(n);i=z[1],u=h,u.test(i)&&(n=i,u=S,a=x,l=w,u.test(n)?n+="e":a.test(n)?(s=y,n=n.replace(s,"")):l.test(n)&&(n+="e"));}if(s=I,s.test(n)){var z=s.exec(n);i=z[1],n=i+"i";}if(s=b,s.test(n)){var z=s.exec(n);i=z[1],o=z[2],s=d,s.test(i)&&(n=i+e[o]);}if(s=E,s.test(n)){var z=s.exec(n);i=z[1],o=z[2],s=d,s.test(i)&&(n=i+t[o]);}if(s=D,u=F,s.test(n)){var z=s.exec(n);i=z[1],s=c,s.test(i)&&(n=i);}else if(u.test(n)){var z=u.exec(n);i=z[1]+z[2],u=c,u.test(i)&&(n=i);}if(s=_,s.test(n)){var z=s.exec(n);i=z[1],s=c,u=f,a=k,(s.test(i)||u.test(i)&&!a.test(i))&&(n=i);}return s=P,u=c,s.test(n)&&u.test(n)&&(s=y,n=n.replace(s,"")),"y"==r&&(n=r.toLowerCase()+n.substr(1)),n};return z}(),t.Pipeline.registerFunction(t.stemmer,"stemmer"),t.stopWordFilter=function(e){return e&&t.stopWordFilter.stopWords[e]!==!0?e:void 0},t.clearStopWords=function(){t.stopWordFilter.stopWords={};},t.addStopWords=function(e){null!=e&&Array.isArray(e)!==!1&&e.forEach(function(e){t.stopWordFilter.stopWords[e]=!0;},this);},t.resetStopWords=function(){t.stopWordFilter.stopWords=t.defaultStopWords;},t.defaultStopWords={"":!0,a:!0,able:!0,about:!0,across:!0,after:!0,all:!0,almost:!0,also:!0,am:!0,among:!0,an:!0,and:!0,any:!0,are:!0,as:!0,at:!0,be:!0,because:!0,been:!0,but:!0,by:!0,can:!0,cannot:!0,could:!0,dear:!0,did:!0,"do":!0,does:!0,either:!0,"else":!0,ever:!0,every:!0,"for":!0,from:!0,get:!0,got:!0,had:!0,has:!0,have:!0,he:!0,her:!0,hers:!0,him:!0,his:!0,how:!0,however:!0,i:!0,"if":!0,"in":!0,into:!0,is:!0,it:!0,its:!0,just:!0,least:!0,let:!0,like:!0,likely:!0,may:!0,me:!0,might:!0,most:!0,must:!0,my:!0,neither:!0,no:!0,nor:!0,not:!0,of:!0,off:!0,often:!0,on:!0,only:!0,or:!0,other:!0,our:!0,own:!0,rather:!0,said:!0,say:!0,says:!0,she:!0,should:!0,since:!0,so:!0,some:!0,than:!0,that:!0,the:!0,their:!0,them:!0,then:!0,there:!0,these:!0,they:!0,"this":!0,tis:!0,to:!0,too:!0,twas:!0,us:!0,wants:!0,was:!0,we:!0,were:!0,what:!0,when:!0,where:!0,which:!0,"while":!0,who:!0,whom:!0,why:!0,will:!0,"with":!0,would:!0,yet:!0,you:!0,your:!0},t.stopWordFilter.stopWords=t.defaultStopWords,t.Pipeline.registerFunction(t.stopWordFilter,"stopWordFilter"),t.trimmer=function(e){if(null===e||void 0===e)throw new Error("token should not be undefined");return e.replace(/^\W+/,"").replace(/\W+$/,"")},t.Pipeline.registerFunction(t.trimmer,"trimmer"),t.InvertedIndex=function(){this.root={docs:{},df:0};},t.InvertedIndex.load=function(e){var t=new this;return t.root=e.root,t},t.InvertedIndex.prototype.addToken=function(e,t,n){for(var n=n||this.root,i=0;i<=e.length-1;){var o=e[i];o in n||(n[o]={docs:{},df:0}),i+=1,n=n[o];}var r=t.ref;n.docs[r]?n.docs[r]={tf:t.tf}:(n.docs[r]={tf:t.tf},n.df+=1);},t.InvertedIndex.prototype.hasToken=function(e){if(!e)return !1;for(var t=this.root,n=0;n<e.length;n++){if(!t[e[n]])return !1;t=t[e[n]];}return !0},t.InvertedIndex.prototype.getNode=function(e){if(!e)return null;for(var t=this.root,n=0;n<e.length;n++){if(!t[e[n]])return null;t=t[e[n]];}return t},t.InvertedIndex.prototype.getDocs=function(e){var t=this.getNode(e);return null==t?{}:t.docs},t.InvertedIndex.prototype.getTermFrequency=function(e,t){var n=this.getNode(e);return null==n?0:t in n.docs?n.docs[t].tf:0},t.InvertedIndex.prototype.getDocFreq=function(e){var t=this.getNode(e);return null==t?0:t.df},t.InvertedIndex.prototype.removeToken=function(e,t){if(e){var n=this.getNode(e);null!=n&&t in n.docs&&(delete n.docs[t],n.df-=1);}},t.InvertedIndex.prototype.expandToken=function(e,t,n){if(null==e||""==e)return [];var t=t||[];if(void 0==n&&(n=this.getNode(e),null==n))return t;n.df>0&&t.push(e);for(var i in n)"docs"!==i&&"df"!==i&&this.expandToken(e+i,t,n[i]);return t},t.InvertedIndex.prototype.toJSON=function(){return {root:this.root}},t.Configuration=function(e,n){var e=e||"";if(void 0==n||null==n)throw new Error("fields should not be null");this.config={};var i;try{i=JSON.parse(e),this.buildUserConfig(i,n);}catch(o){t.utils.warn("user configuration parse failed, will use default configuration"),this.buildDefaultConfig(n);}},t.Configuration.prototype.buildDefaultConfig=function(e){this.reset(),e.forEach(function(e){this.config[e]={boost:1,bool:"OR",expand:!1};},this);},t.Configuration.prototype.buildUserConfig=function(e,n){var i="OR",o=!1;if(this.reset(),"bool"in e&&(i=e.bool||i),"expand"in e&&(o=e.expand||o),"fields"in e)for(var r in e.fields)if(n.indexOf(r)>-1){var s=e.fields[r],u=o;void 0!=s.expand&&(u=s.expand),this.config[r]={boost:s.boost||0===s.boost?s.boost:1,bool:s.bool||i,expand:u};}else t.utils.warn("field name in user configuration not found in index instance fields");else this.addAllFields2UserConfig(i,o,n);},t.Configuration.prototype.addAllFields2UserConfig=function(e,t,n){n.forEach(function(n){this.config[n]={boost:1,bool:e,expand:t};},this);},t.Configuration.prototype.get=function(){return this.config},t.Configuration.prototype.reset=function(){this.config={};},lunr.SortedSet=function(){this.length=0,this.elements=[];},lunr.SortedSet.load=function(e){var t=new this;return t.elements=e,t.length=e.length,t},lunr.SortedSet.prototype.add=function(){var e,t;for(e=0;e<arguments.length;e++)t=arguments[e],~this.indexOf(t)||this.elements.splice(this.locationFor(t),0,t);this.length=this.elements.length;},lunr.SortedSet.prototype.toArray=function(){return this.elements.slice()},lunr.SortedSet.prototype.map=function(e,t){return this.elements.map(e,t)},lunr.SortedSet.prototype.forEach=function(e,t){return this.elements.forEach(e,t)},lunr.SortedSet.prototype.indexOf=function(e){for(var t=0,n=this.elements.length,i=n-t,o=t+Math.floor(i/2),r=this.elements[o];i>1;){if(r===e)return o;e>r&&(t=o),r>e&&(n=o),i=n-t,o=t+Math.floor(i/2),r=this.elements[o];}return r===e?o:-1},lunr.SortedSet.prototype.locationFor=function(e){for(var t=0,n=this.elements.length,i=n-t,o=t+Math.floor(i/2),r=this.elements[o];i>1;)e>r&&(t=o),r>e&&(n=o),i=n-t,o=t+Math.floor(i/2),r=this.elements[o];return r>e?o:e>r?o+1:void 0},lunr.SortedSet.prototype.intersect=function(e){for(var t=new lunr.SortedSet,n=0,i=0,o=this.length,r=e.length,s=this.elements,u=e.elements;;){if(n>o-1||i>r-1)break;s[n]!==u[i]?s[n]<u[i]?n++:s[n]>u[i]&&i++:(t.add(s[n]),n++,i++);}return t},lunr.SortedSet.prototype.clone=function(){var e=new lunr.SortedSet;return e.elements=this.toArray(),e.length=e.elements.length,e},lunr.SortedSet.prototype.union=function(e){var t,n,i;this.length>=e.length?(t=this,n=e):(t=e,n=this),i=t.clone();for(var o=0,r=n.toArray();o<r.length;o++)i.add(r[o]);return i},lunr.SortedSet.prototype.toJSON=function(){return this.toArray()},function(e,t){module.exports=t();}(this,function(){return t});}();
	});

	const escape = {
	  '&': '&amp;',
	  '<': '&lt;',
	  '>': '&gt;',
	  '"': '&quot;',
	  "'": '&#x27;',
	  '`': '&#x60;',
	  '=': '&#x3D;'
	};

	const badChars = /[&<>"'`=]/g,
	  possible = /[&<>"'`=]/;

	function escapeChar(chr) {
	  return escape[chr];
	}

	function extend$1(obj /* , ...source */) {
	  for (let i = 1; i < arguments.length; i++) {
	    for (let key in arguments[i]) {
	      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
	        obj[key] = arguments[i][key];
	      }
	    }
	  }

	  return obj;
	}

	let toString$1 = Object.prototype.toString;

	// Sourced from lodash
	// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
	/* eslint-disable func-style */
	let isFunction$1 = function(value) {
	  return typeof value === 'function';
	};
	// fallback for older versions of Chrome and Safari
	/* istanbul ignore next */
	if (isFunction$1(/x/)) {
	  isFunction$1 = function(value) {
	    return (
	      typeof value === 'function' &&
	      toString$1.call(value) === '[object Function]'
	    );
	  };
	}
	/* eslint-enable func-style */

	/* istanbul ignore next */
	const isArray$1 =
	  Array.isArray ||
	  function(value) {
	    return value && typeof value === 'object'
	      ? toString$1.call(value) === '[object Array]'
	      : false;
	  };

	// Older IE versions do not directly support indexOf so we must implement our own, sadly.
	function indexOf(array, value) {
	  for (let i = 0, len = array.length; i < len; i++) {
	    if (array[i] === value) {
	      return i;
	    }
	  }
	  return -1;
	}

	function escapeExpression(string) {
	  if (typeof string !== 'string') {
	    // don't escape SafeStrings, since they're already safe
	    if (string && string.toHTML) {
	      return string.toHTML();
	    } else if (string == null) {
	      return '';
	    } else if (!string) {
	      return string + '';
	    }

	    // Force a string conversion as this will be done by the append regardless and
	    // the regex test will do this transparently behind the scenes, causing issues if
	    // an object's to string has escaped characters in it.
	    string = '' + string;
	  }

	  if (!possible.test(string)) {
	    return string;
	  }
	  return string.replace(badChars, escapeChar);
	}

	function isEmpty(value) {
	  if (!value && value !== 0) {
	    return true;
	  } else if (isArray$1(value) && value.length === 0) {
	    return true;
	  } else {
	    return false;
	  }
	}

	function createFrame(object) {
	  let frame = extend$1({}, object);
	  frame._parent = object;
	  return frame;
	}

	function blockParams(params, ids) {
	  params.path = ids;
	  return params;
	}

	function appendContextPath(contextPath, id) {
	  return (contextPath ? contextPath + '.' : '') + id;
	}

	var Utils = /*#__PURE__*/Object.freeze({
		extend: extend$1,
		toString: toString$1,
		get isFunction () { return isFunction$1; },
		isArray: isArray$1,
		indexOf: indexOf,
		escapeExpression: escapeExpression,
		isEmpty: isEmpty,
		createFrame: createFrame,
		blockParams: blockParams,
		appendContextPath: appendContextPath
	});

	const errorProps = [
	  'description',
	  'fileName',
	  'lineNumber',
	  'endLineNumber',
	  'message',
	  'name',
	  'number',
	  'stack'
	];

	function Exception(message, node) {
	  let loc = node && node.loc,
	    line,
	    endLineNumber,
	    column,
	    endColumn;

	  if (loc) {
	    line = loc.start.line;
	    endLineNumber = loc.end.line;
	    column = loc.start.column;
	    endColumn = loc.end.column;

	    message += ' - ' + line + ':' + column;
	  }

	  let tmp = Error.prototype.constructor.call(this, message);

	  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
	  for (let idx = 0; idx < errorProps.length; idx++) {
	    this[errorProps[idx]] = tmp[errorProps[idx]];
	  }

	  /* istanbul ignore else */
	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, Exception);
	  }

	  try {
	    if (loc) {
	      this.lineNumber = line;
	      this.endLineNumber = endLineNumber;

	      // Work around issue under safari where we can't directly set the column value
	      /* istanbul ignore next */
	      if (Object.defineProperty) {
	        Object.defineProperty(this, 'column', {
	          value: column,
	          enumerable: true
	        });
	        Object.defineProperty(this, 'endColumn', {
	          value: endColumn,
	          enumerable: true
	        });
	      } else {
	        this.column = column;
	        this.endColumn = endColumn;
	      }
	    }
	  } catch (nop) {
	    /* Ignore if the browser is very particular */
	  }
	}

	Exception.prototype = new Error();

	function registerBlockHelperMissing(instance) {
	  instance.registerHelper('blockHelperMissing', function(context, options) {
	    let inverse = options.inverse,
	      fn = options.fn;

	    if (context === true) {
	      return fn(this);
	    } else if (context === false || context == null) {
	      return inverse(this);
	    } else if (isArray$1(context)) {
	      if (context.length > 0) {
	        if (options.ids) {
	          options.ids = [options.name];
	        }

	        return instance.helpers.each(context, options);
	      } else {
	        return inverse(this);
	      }
	    } else {
	      if (options.data && options.ids) {
	        let data = createFrame(options.data);
	        data.contextPath = appendContextPath(
	          options.data.contextPath,
	          options.name
	        );
	        options = { data: data };
	      }

	      return fn(context, options);
	    }
	  });
	}

	function registerEach(instance) {
	  instance.registerHelper('each', function(context, options) {
	    if (!options) {
	      throw new Exception('Must pass iterator to #each');
	    }

	    let fn = options.fn,
	      inverse = options.inverse,
	      i = 0,
	      ret = '',
	      data,
	      contextPath;

	    if (options.data && options.ids) {
	      contextPath =
	        appendContextPath(options.data.contextPath, options.ids[0]) + '.';
	    }

	    if (isFunction$1(context)) {
	      context = context.call(this);
	    }

	    if (options.data) {
	      data = createFrame(options.data);
	    }

	    function execIteration(field, index, last) {
	      if (data) {
	        data.key = field;
	        data.index = index;
	        data.first = index === 0;
	        data.last = !!last;

	        if (contextPath) {
	          data.contextPath = contextPath + field;
	        }
	      }

	      ret =
	        ret +
	        fn(context[field], {
	          data: data,
	          blockParams: blockParams(
	            [context[field], field],
	            [contextPath + field, null]
	          )
	        });
	    }

	    if (context && typeof context === 'object') {
	      if (isArray$1(context)) {
	        for (let j = context.length; i < j; i++) {
	          if (i in context) {
	            execIteration(i, i, i === context.length - 1);
	          }
	        }
	      } else if (global$1.Symbol && context[global$1.Symbol.iterator]) {
	        const newContext = [];
	        const iterator = context[global$1.Symbol.iterator]();
	        for (let it = iterator.next(); !it.done; it = iterator.next()) {
	          newContext.push(it.value);
	        }
	        context = newContext;
	        for (let j = context.length; i < j; i++) {
	          execIteration(i, i, i === context.length - 1);
	        }
	      } else {
	        let priorKey;

	        Object.keys(context).forEach(key => {
	          // We're running the iterations one step out of sync so we can detect
	          // the last iteration without have to scan the object twice and create
	          // an itermediate keys array.
	          if (priorKey !== undefined) {
	            execIteration(priorKey, i - 1);
	          }
	          priorKey = key;
	          i++;
	        });
	        if (priorKey !== undefined) {
	          execIteration(priorKey, i - 1, true);
	        }
	      }
	    }

	    if (i === 0) {
	      ret = inverse(this);
	    }

	    return ret;
	  });
	}

	function registerHelperMissing(instance) {
	  instance.registerHelper('helperMissing', function(/* [args, ]options */) {
	    if (arguments.length === 1) {
	      // A missing field in a {{foo}} construct.
	      return undefined;
	    } else {
	      // Someone is actually trying to call something, blow up.
	      throw new Exception(
	        'Missing helper: "' + arguments[arguments.length - 1].name + '"'
	      );
	    }
	  });
	}

	function registerIf(instance) {
	  instance.registerHelper('if', function(conditional, options) {
	    if (arguments.length != 2) {
	      throw new Exception('#if requires exactly one argument');
	    }
	    if (isFunction$1(conditional)) {
	      conditional = conditional.call(this);
	    }

	    // Default behavior is to render the positive path if the value is truthy and not empty.
	    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
	    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
	    if ((!options.hash.includeZero && !conditional) || isEmpty(conditional)) {
	      return options.inverse(this);
	    } else {
	      return options.fn(this);
	    }
	  });

	  instance.registerHelper('unless', function(conditional, options) {
	    if (arguments.length != 2) {
	      throw new Exception('#unless requires exactly one argument');
	    }
	    return instance.helpers['if'].call(this, conditional, {
	      fn: options.inverse,
	      inverse: options.fn,
	      hash: options.hash
	    });
	  });
	}

	function registerLog(instance) {
	  instance.registerHelper('log', function(/* message, options */) {
	    let args = [undefined],
	      options = arguments[arguments.length - 1];
	    for (let i = 0; i < arguments.length - 1; i++) {
	      args.push(arguments[i]);
	    }

	    let level = 1;
	    if (options.hash.level != null) {
	      level = options.hash.level;
	    } else if (options.data && options.data.level != null) {
	      level = options.data.level;
	    }
	    args[0] = level;

	    instance.log(...args);
	  });
	}

	function registerLookup(instance) {
	  instance.registerHelper('lookup', function(obj, field, options) {
	    if (!obj) {
	      // Note for 5.0: Change to "obj == null" in 5.0
	      return obj;
	    }
	    return options.lookupProperty(obj, field);
	  });
	}

	function registerWith(instance) {
	  instance.registerHelper('with', function(context, options) {
	    if (arguments.length != 2) {
	      throw new Exception('#with requires exactly one argument');
	    }
	    if (isFunction$1(context)) {
	      context = context.call(this);
	    }

	    let fn = options.fn;

	    if (!isEmpty(context)) {
	      let data = options.data;
	      if (options.data && options.ids) {
	        data = createFrame(options.data);
	        data.contextPath = appendContextPath(
	          options.data.contextPath,
	          options.ids[0]
	        );
	      }

	      return fn(context, {
	        data: data,
	        blockParams: blockParams([context], [data && data.contextPath])
	      });
	    } else {
	      return options.inverse(this);
	    }
	  });
	}

	function registerDefaultHelpers(instance) {
	  registerBlockHelperMissing(instance);
	  registerEach(instance);
	  registerHelperMissing(instance);
	  registerIf(instance);
	  registerLog(instance);
	  registerLookup(instance);
	  registerWith(instance);
	}

	function moveHelperToHooks(instance, helperName, keepHelper) {
	  if (instance.helpers[helperName]) {
	    instance.hooks[helperName] = instance.helpers[helperName];
	    if (!keepHelper) {
	      delete instance.helpers[helperName];
	    }
	  }
	}

	function registerInline(instance) {
	  instance.registerDecorator('inline', function(fn, props, container, options) {
	    let ret = fn;
	    if (!props.partials) {
	      props.partials = {};
	      ret = function(context, options) {
	        // Create a new partials stack frame prior to exec.
	        let original = container.partials;
	        container.partials = extend$1({}, original, props.partials);
	        let ret = fn(context, options);
	        container.partials = original;
	        return ret;
	      };
	    }

	    props.partials[options.args[0]] = options.fn;

	    return ret;
	  });
	}

	function registerDefaultDecorators(instance) {
	  registerInline(instance);
	}

	let logger = {
	  methodMap: ['debug', 'info', 'warn', 'error'],
	  level: 'info',

	  // Maps a given level value to the `methodMap` indexes above.
	  lookupLevel: function(level) {
	    if (typeof level === 'string') {
	      let levelMap = indexOf(logger.methodMap, level.toLowerCase());
	      if (levelMap >= 0) {
	        level = levelMap;
	      } else {
	        level = parseInt(level, 10);
	      }
	    }

	    return level;
	  },

	  // Can be overridden in the host environment
	  log: function(level, ...message) {
	    level = logger.lookupLevel(level);

	    if (
	      typeof console !== 'undefined' &&
	      logger.lookupLevel(logger.level) <= level
	    ) {
	      let method = logger.methodMap[level];
	      // eslint-disable-next-line no-console
	      if (!console[method]) {
	        method = 'log';
	      }
	      console[method](...message); // eslint-disable-line no-console
	    }
	  }
	};

	/**
	 * Create a new object with "null"-prototype to avoid truthy results on prototype properties.
	 * The resulting object can be used with "object[property]" to check if a property exists
	 * @param {...object} sources a varargs parameter of source objects that will be merged
	 * @returns {object}
	 */
	function createNewLookupObject(...sources) {
	  return extend$1(Object.create(null), ...sources);
	}

	const loggedProperties = Object.create(null);

	function createProtoAccessControl(runtimeOptions) {
	  let defaultMethodWhiteList = Object.create(null);
	  defaultMethodWhiteList['constructor'] = false;
	  defaultMethodWhiteList['__defineGetter__'] = false;
	  defaultMethodWhiteList['__defineSetter__'] = false;
	  defaultMethodWhiteList['__lookupGetter__'] = false;

	  let defaultPropertyWhiteList = Object.create(null);
	  // eslint-disable-next-line no-proto
	  defaultPropertyWhiteList['__proto__'] = false;

	  return {
	    properties: {
	      whitelist: createNewLookupObject(
	        defaultPropertyWhiteList,
	        runtimeOptions.allowedProtoProperties
	      ),
	      defaultValue: runtimeOptions.allowProtoPropertiesByDefault
	    },
	    methods: {
	      whitelist: createNewLookupObject(
	        defaultMethodWhiteList,
	        runtimeOptions.allowedProtoMethods
	      ),
	      defaultValue: runtimeOptions.allowProtoMethodsByDefault
	    }
	  };
	}

	function resultIsAllowed(result, protoAccessControl, propertyName) {
	  if (typeof result === 'function') {
	    return checkWhiteList(protoAccessControl.methods, propertyName);
	  } else {
	    return checkWhiteList(protoAccessControl.properties, propertyName);
	  }
	}

	function checkWhiteList(protoAccessControlForType, propertyName) {
	  if (protoAccessControlForType.whitelist[propertyName] !== undefined) {
	    return protoAccessControlForType.whitelist[propertyName] === true;
	  }
	  if (protoAccessControlForType.defaultValue !== undefined) {
	    return protoAccessControlForType.defaultValue;
	  }
	  logUnexpecedPropertyAccessOnce(propertyName);
	  return false;
	}

	function logUnexpecedPropertyAccessOnce(propertyName) {
	  if (loggedProperties[propertyName] !== true) {
	    loggedProperties[propertyName] = true;
	    undefined(
	      'error',
	      `Handlebars: Access has been denied to resolve the property "${propertyName}" because it is not an "own property" of its parent.\n` +
	        `You can add a runtime option to disable the check or this warning:\n` +
	        `See https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details`
	    );
	  }
	}

	function resetLoggedProperties() {
	  Object.keys(loggedProperties).forEach(propertyName => {
	    delete loggedProperties[propertyName];
	  });
	}

	const VERSION = '4.7.7';
	const COMPILER_REVISION = 8;
	const LAST_COMPATIBLE_COMPILER_REVISION = 7;

	const REVISION_CHANGES = {
	  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
	  2: '== 1.0.0-rc.3',
	  3: '== 1.0.0-rc.4',
	  4: '== 1.x.x',
	  5: '== 2.0.0-alpha.x',
	  6: '>= 2.0.0-beta.1',
	  7: '>= 4.0.0 <4.3.0',
	  8: '>= 4.3.0'
	};

	const objectType = '[object Object]';

	function HandlebarsEnvironment(helpers, partials, decorators) {
	  this.helpers = helpers || {};
	  this.partials = partials || {};
	  this.decorators = decorators || {};

	  registerDefaultHelpers(this);
	  registerDefaultDecorators(this);
	}

	HandlebarsEnvironment.prototype = {
	  constructor: HandlebarsEnvironment,

	  logger: logger,
	  log: logger.log,

	  registerHelper: function(name, fn) {
	    if (toString$1.call(name) === objectType) {
	      if (fn) {
	        throw new Exception('Arg not supported with multiple helpers');
	      }
	      extend$1(this.helpers, name);
	    } else {
	      this.helpers[name] = fn;
	    }
	  },
	  unregisterHelper: function(name) {
	    delete this.helpers[name];
	  },

	  registerPartial: function(name, partial) {
	    if (toString$1.call(name) === objectType) {
	      extend$1(this.partials, name);
	    } else {
	      if (typeof partial === 'undefined') {
	        throw new Exception(
	          `Attempting to register a partial called "${name}" as undefined`
	        );
	      }
	      this.partials[name] = partial;
	    }
	  },
	  unregisterPartial: function(name) {
	    delete this.partials[name];
	  },

	  registerDecorator: function(name, fn) {
	    if (toString$1.call(name) === objectType) {
	      if (fn) {
	        throw new Exception('Arg not supported with multiple decorators');
	      }
	      extend$1(this.decorators, name);
	    } else {
	      this.decorators[name] = fn;
	    }
	  },
	  unregisterDecorator: function(name) {
	    delete this.decorators[name];
	  },
	  /**
	   * Reset the memory of illegal property accesses that have already been logged.
	   * @deprecated should only be used in handlebars test-cases
	   */
	  resetLoggedPropertyAccesses() {
	    resetLoggedProperties();
	  }
	};

	let log = logger.log;

	var base = /*#__PURE__*/Object.freeze({
		VERSION: VERSION,
		COMPILER_REVISION: COMPILER_REVISION,
		LAST_COMPATIBLE_COMPILER_REVISION: LAST_COMPATIBLE_COMPILER_REVISION,
		REVISION_CHANGES: REVISION_CHANGES,
		HandlebarsEnvironment: HandlebarsEnvironment,
		log: log,
		createFrame: createFrame,
		logger: logger
	});

	// Build out our basic SafeString type
	function SafeString(string) {
	  this.string = string;
	}

	SafeString.prototype.toString = SafeString.prototype.toHTML = function() {
	  return '' + this.string;
	};

	function wrapHelper(helper, transformOptionsFn) {
	  if (typeof helper !== 'function') {
	    // This should not happen, but apparently it does in https://github.com/wycats/handlebars.js/issues/1639
	    // We try to make the wrapper least-invasive by not wrapping it, if the helper is not a function.
	    return helper;
	  }
	  let wrapper = function(/* dynamic arguments */) {
	    const options = arguments[arguments.length - 1];
	    arguments[arguments.length - 1] = transformOptionsFn(options);
	    return helper.apply(this, arguments);
	  };
	  return wrapper;
	}

	function checkRevision(compilerInfo) {
	  const compilerRevision = (compilerInfo && compilerInfo[0]) || 1,
	    currentRevision = COMPILER_REVISION;

	  if (
	    compilerRevision >= LAST_COMPATIBLE_COMPILER_REVISION &&
	    compilerRevision <= COMPILER_REVISION
	  ) {
	    return;
	  }

	  if (compilerRevision < LAST_COMPATIBLE_COMPILER_REVISION) {
	    const runtimeVersions = REVISION_CHANGES[currentRevision],
	      compilerVersions = REVISION_CHANGES[compilerRevision];
	    throw new Exception(
	      'Template was precompiled with an older version of Handlebars than the current runtime. ' +
	        'Please update your precompiler to a newer version (' +
	        runtimeVersions +
	        ') or downgrade your runtime to an older version (' +
	        compilerVersions +
	        ').'
	    );
	  } else {
	    // Use the embedded version info since the runtime doesn't know about this revision yet
	    throw new Exception(
	      'Template was precompiled with a newer version of Handlebars than the current runtime. ' +
	        'Please update your runtime to a newer version (' +
	        compilerInfo[1] +
	        ').'
	    );
	  }
	}

	function template(templateSpec, env) {
	  /* istanbul ignore next */
	  if (!env) {
	    throw new Exception('No environment passed to template');
	  }
	  if (!templateSpec || !templateSpec.main) {
	    throw new Exception('Unknown template object: ' + typeof templateSpec);
	  }

	  templateSpec.main.decorator = templateSpec.main_d;

	  // Note: Using env.VM references rather than local var references throughout this section to allow
	  // for external users to override these as pseudo-supported APIs.
	  env.VM.checkRevision(templateSpec.compiler);

	  // backwards compatibility for precompiled templates with compiler-version 7 (<4.3.0)
	  const templateWasPrecompiledWithCompilerV7 =
	    templateSpec.compiler && templateSpec.compiler[0] === 7;

	  function invokePartialWrapper(partial, context, options) {
	    if (options.hash) {
	      context = extend$1({}, context, options.hash);
	      if (options.ids) {
	        options.ids[0] = true;
	      }
	    }
	    partial = env.VM.resolvePartial.call(this, partial, context, options);

	    let extendedOptions = extend$1({}, options, {
	      hooks: this.hooks,
	      protoAccessControl: this.protoAccessControl
	    });

	    let result = env.VM.invokePartial.call(
	      this,
	      partial,
	      context,
	      extendedOptions
	    );

	    if (result == null && env.compile) {
	      options.partials[options.name] = env.compile(
	        partial,
	        templateSpec.compilerOptions,
	        env
	      );
	      result = options.partials[options.name](context, extendedOptions);
	    }
	    if (result != null) {
	      if (options.indent) {
	        let lines = result.split('\n');
	        for (let i = 0, l = lines.length; i < l; i++) {
	          if (!lines[i] && i + 1 === l) {
	            break;
	          }

	          lines[i] = options.indent + lines[i];
	        }
	        result = lines.join('\n');
	      }
	      return result;
	    } else {
	      throw new Exception(
	        'The partial ' +
	          options.name +
	          ' could not be compiled when running in runtime-only mode'
	      );
	    }
	  }

	  // Just add water
	  let container = {
	    strict: function(obj, name, loc) {
	      if (!obj || !(name in obj)) {
	        throw new Exception('"' + name + '" not defined in ' + obj, {
	          loc: loc
	        });
	      }
	      return container.lookupProperty(obj, name);
	    },
	    lookupProperty: function(parent, propertyName) {
	      let result = parent[propertyName];
	      if (result == null) {
	        return result;
	      }
	      if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
	        return result;
	      }

	      if (resultIsAllowed(result, container.protoAccessControl, propertyName)) {
	        return result;
	      }
	      return undefined;
	    },
	    lookup: function(depths, name) {
	      const len = depths.length;
	      for (let i = 0; i < len; i++) {
	        let result = depths[i] && container.lookupProperty(depths[i], name);
	        if (result != null) {
	          return depths[i][name];
	        }
	      }
	    },
	    lambda: function(current, context) {
	      return typeof current === 'function' ? current.call(context) : current;
	    },

	    escapeExpression: escapeExpression,
	    invokePartial: invokePartialWrapper,

	    fn: function(i) {
	      let ret = templateSpec[i];
	      ret.decorator = templateSpec[i + '_d'];
	      return ret;
	    },

	    programs: [],
	    program: function(i, data, declaredBlockParams, blockParams$$1, depths) {
	      let programWrapper = this.programs[i],
	        fn = this.fn(i);
	      if (data || depths || blockParams$$1 || declaredBlockParams) {
	        programWrapper = wrapProgram(
	          this,
	          i,
	          fn,
	          data,
	          declaredBlockParams,
	          blockParams$$1,
	          depths
	        );
	      } else if (!programWrapper) {
	        programWrapper = this.programs[i] = wrapProgram(this, i, fn);
	      }
	      return programWrapper;
	    },

	    data: function(value, depth) {
	      while (value && depth--) {
	        value = value._parent;
	      }
	      return value;
	    },
	    mergeIfNeeded: function(param, common) {
	      let obj = param || common;

	      if (param && common && param !== common) {
	        obj = extend$1({}, common, param);
	      }

	      return obj;
	    },
	    // An empty object to use as replacement for null-contexts
	    nullContext: Object.seal({}),

	    noop: env.VM.noop,
	    compilerInfo: templateSpec.compiler
	  };

	  function ret(context, options = {}) {
	    let data = options.data;

	    ret._setup(options);
	    if (!options.partial && templateSpec.useData) {
	      data = initData(context, data);
	    }
	    let depths,
	      blockParams$$1 = templateSpec.useBlockParams ? [] : undefined;
	    if (templateSpec.useDepths) {
	      if (options.depths) {
	        depths =
	          context != options.depths[0]
	            ? [context].concat(options.depths)
	            : options.depths;
	      } else {
	        depths = [context];
	      }
	    }

	    function main(context /*, options*/) {
	      return (
	        '' +
	        templateSpec.main(
	          container,
	          context,
	          container.helpers,
	          container.partials,
	          data,
	          blockParams$$1,
	          depths
	        )
	      );
	    }

	    main = executeDecorators(
	      templateSpec.main,
	      main,
	      container,
	      options.depths || [],
	      data,
	      blockParams$$1
	    );
	    return main(context, options);
	  }

	  ret.isTop = true;

	  ret._setup = function(options) {
	    if (!options.partial) {
	      let mergedHelpers = extend$1({}, env.helpers, options.helpers);
	      wrapHelpersToPassLookupProperty(mergedHelpers, container);
	      container.helpers = mergedHelpers;

	      if (templateSpec.usePartial) {
	        // Use mergeIfNeeded here to prevent compiling global partials multiple times
	        container.partials = container.mergeIfNeeded(
	          options.partials,
	          env.partials
	        );
	      }
	      if (templateSpec.usePartial || templateSpec.useDecorators) {
	        container.decorators = extend$1(
	          {},
	          env.decorators,
	          options.decorators
	        );
	      }

	      container.hooks = {};
	      container.protoAccessControl = createProtoAccessControl(options);

	      let keepHelperInHelpers =
	        options.allowCallsToHelperMissing ||
	        templateWasPrecompiledWithCompilerV7;
	      moveHelperToHooks(container, 'helperMissing', keepHelperInHelpers);
	      moveHelperToHooks(container, 'blockHelperMissing', keepHelperInHelpers);
	    } else {
	      container.protoAccessControl = options.protoAccessControl; // internal option
	      container.helpers = options.helpers;
	      container.partials = options.partials;
	      container.decorators = options.decorators;
	      container.hooks = options.hooks;
	    }
	  };

	  ret._child = function(i, data, blockParams$$1, depths) {
	    if (templateSpec.useBlockParams && !blockParams$$1) {
	      throw new Exception('must pass block params');
	    }
	    if (templateSpec.useDepths && !depths) {
	      throw new Exception('must pass parent depths');
	    }

	    return wrapProgram(
	      container,
	      i,
	      templateSpec[i],
	      data,
	      0,
	      blockParams$$1,
	      depths
	    );
	  };
	  return ret;
	}

	function wrapProgram(
	  container,
	  i,
	  fn,
	  data,
	  declaredBlockParams,
	  blockParams$$1,
	  depths
	) {
	  function prog(context, options = {}) {
	    let currentDepths = depths;
	    if (
	      depths &&
	      context != depths[0] &&
	      !(context === container.nullContext && depths[0] === null)
	    ) {
	      currentDepths = [context].concat(depths);
	    }

	    return fn(
	      container,
	      context,
	      container.helpers,
	      container.partials,
	      options.data || data,
	      blockParams$$1 && [options.blockParams].concat(blockParams$$1),
	      currentDepths
	    );
	  }

	  prog = executeDecorators(fn, prog, container, depths, data, blockParams$$1);

	  prog.program = i;
	  prog.depth = depths ? depths.length : 0;
	  prog.blockParams = declaredBlockParams || 0;
	  return prog;
	}

	/**
	 * This is currently part of the official API, therefore implementation details should not be changed.
	 */
	function resolvePartial(partial, context, options) {
	  if (!partial) {
	    if (options.name === '@partial-block') {
	      partial = options.data['partial-block'];
	    } else {
	      partial = options.partials[options.name];
	    }
	  } else if (!partial.call && !options.name) {
	    // This is a dynamic partial that returned a string
	    options.name = partial;
	    partial = options.partials[partial];
	  }
	  return partial;
	}

	function invokePartial(partial, context, options) {
	  // Use the current closure context to save the partial-block if this partial
	  const currentPartialBlock = options.data && options.data['partial-block'];
	  options.partial = true;
	  if (options.ids) {
	    options.data.contextPath = options.ids[0] || options.data.contextPath;
	  }

	  let partialBlock;
	  if (options.fn && options.fn !== noop$1) {
	    options.data = createFrame(options.data);
	    // Wrapper function to get access to currentPartialBlock from the closure
	    let fn = options.fn;
	    partialBlock = options.data['partial-block'] = function partialBlockWrapper(
	      context,
	      options = {}
	    ) {
	      // Restore the partial-block from the closure for the execution of the block
	      // i.e. the part inside the block of the partial call.
	      options.data = createFrame(options.data);
	      options.data['partial-block'] = currentPartialBlock;
	      return fn(context, options);
	    };
	    if (fn.partials) {
	      options.partials = extend$1({}, options.partials, fn.partials);
	    }
	  }

	  if (partial === undefined && partialBlock) {
	    partial = partialBlock;
	  }

	  if (partial === undefined) {
	    throw new Exception('The partial ' + options.name + ' could not be found');
	  } else if (partial instanceof Function) {
	    return partial(context, options);
	  }
	}

	function noop$1() {
	  return '';
	}

	function initData(context, data) {
	  if (!data || !('root' in data)) {
	    data = data ? createFrame(data) : {};
	    data.root = context;
	  }
	  return data;
	}

	function executeDecorators(fn, prog, container, depths, data, blockParams$$1) {
	  if (fn.decorator) {
	    let props = {};
	    prog = fn.decorator(
	      prog,
	      props,
	      container,
	      depths && depths[0],
	      data,
	      blockParams$$1,
	      depths
	    );
	    extend$1(prog, props);
	  }
	  return prog;
	}

	function wrapHelpersToPassLookupProperty(mergedHelpers, container) {
	  Object.keys(mergedHelpers).forEach(helperName => {
	    let helper = mergedHelpers[helperName];
	    mergedHelpers[helperName] = passLookupPropertyOption(helper, container);
	  });
	}

	function passLookupPropertyOption(helper, container) {
	  const lookupProperty = container.lookupProperty;
	  return wrapHelper(helper, options => {
	    return extend$1({ lookupProperty }, options);
	  });
	}

	var runtime = /*#__PURE__*/Object.freeze({
		checkRevision: checkRevision,
		template: template,
		wrapProgram: wrapProgram,
		resolvePartial: resolvePartial,
		invokePartial: invokePartial,
		noop: noop$1
	});

	function noConflict(Handlebars) {
	  /* istanbul ignore next */
	  let root = typeof global$1 !== 'undefined' ? global$1 : window,
	    $Handlebars = root.Handlebars;
	  /* istanbul ignore next */
	  Handlebars.noConflict = function() {
	    if (root.Handlebars === Handlebars) {
	      root.Handlebars = $Handlebars;
	    }
	    return Handlebars;
	  };
	}

	// For compatibility and usage outside of module systems, make the Handlebars object a namespace
	function create() {
	  let hb = new HandlebarsEnvironment();

	  extend$1(hb, base);
	  hb.SafeString = SafeString;
	  hb.Exception = Exception;
	  hb.Utils = Utils;
	  hb.escapeExpression = escapeExpression;

	  hb.VM = runtime;
	  hb.template = function(spec) {
	    return template(spec, hb);
	  };

	  return hb;
	}

	let inst = create();
	inst.create = create;

	noConflict(inst);

	inst['default'] = inst;

	let AST = {
	  // Public API used to evaluate derived attributes regarding AST nodes
	  helpers: {
	    // a mustache is definitely a helper if:
	    // * it is an eligible helper, and
	    // * it has at least one parameter or hash segment
	    helperExpression: function(node) {
	      return (
	        node.type === 'SubExpression' ||
	        ((node.type === 'MustacheStatement' ||
	          node.type === 'BlockStatement') &&
	          !!((node.params && node.params.length) || node.hash))
	      );
	    },

	    scopedId: function(path) {
	      return /^\.|this\b/.test(path.original);
	    },

	    // an ID is simple if it only has one part, and that part is not
	    // `..` or `this`.
	    simpleId: function(path) {
	      return (
	        path.parts.length === 1 && !AST.helpers.scopedId(path) && !path.depth
	      );
	    }
	  }
	};

	// File ignored in coverage tests via setting in .istanbul.yml
	/* Jison generated parser */
	var handlebars = (function(){
	var parser = {trace: function trace () { },
	yy: {},
	symbols_: {"error":2,"root":3,"program":4,"EOF":5,"program_repetition0":6,"statement":7,"mustache":8,"block":9,"rawBlock":10,"partial":11,"partialBlock":12,"content":13,"COMMENT":14,"CONTENT":15,"openRawBlock":16,"rawBlock_repetition0":17,"END_RAW_BLOCK":18,"OPEN_RAW_BLOCK":19,"helperName":20,"openRawBlock_repetition0":21,"openRawBlock_option0":22,"CLOSE_RAW_BLOCK":23,"openBlock":24,"block_option0":25,"closeBlock":26,"openInverse":27,"block_option1":28,"OPEN_BLOCK":29,"openBlock_repetition0":30,"openBlock_option0":31,"openBlock_option1":32,"CLOSE":33,"OPEN_INVERSE":34,"openInverse_repetition0":35,"openInverse_option0":36,"openInverse_option1":37,"openInverseChain":38,"OPEN_INVERSE_CHAIN":39,"openInverseChain_repetition0":40,"openInverseChain_option0":41,"openInverseChain_option1":42,"inverseAndProgram":43,"INVERSE":44,"inverseChain":45,"inverseChain_option0":46,"OPEN_ENDBLOCK":47,"OPEN":48,"mustache_repetition0":49,"mustache_option0":50,"OPEN_UNESCAPED":51,"mustache_repetition1":52,"mustache_option1":53,"CLOSE_UNESCAPED":54,"OPEN_PARTIAL":55,"partialName":56,"partial_repetition0":57,"partial_option0":58,"openPartialBlock":59,"OPEN_PARTIAL_BLOCK":60,"openPartialBlock_repetition0":61,"openPartialBlock_option0":62,"param":63,"sexpr":64,"OPEN_SEXPR":65,"sexpr_repetition0":66,"sexpr_option0":67,"CLOSE_SEXPR":68,"hash":69,"hash_repetition_plus0":70,"hashSegment":71,"ID":72,"EQUALS":73,"blockParams":74,"OPEN_BLOCK_PARAMS":75,"blockParams_repetition_plus0":76,"CLOSE_BLOCK_PARAMS":77,"path":78,"dataName":79,"STRING":80,"NUMBER":81,"BOOLEAN":82,"UNDEFINED":83,"NULL":84,"DATA":85,"pathSegments":86,"SEP":87,"$accept":0,"$end":1},
	terminals_: {2:"error",5:"EOF",14:"COMMENT",15:"CONTENT",18:"END_RAW_BLOCK",19:"OPEN_RAW_BLOCK",23:"CLOSE_RAW_BLOCK",29:"OPEN_BLOCK",33:"CLOSE",34:"OPEN_INVERSE",39:"OPEN_INVERSE_CHAIN",44:"INVERSE",47:"OPEN_ENDBLOCK",48:"OPEN",51:"OPEN_UNESCAPED",54:"CLOSE_UNESCAPED",55:"OPEN_PARTIAL",60:"OPEN_PARTIAL_BLOCK",65:"OPEN_SEXPR",68:"CLOSE_SEXPR",72:"ID",73:"EQUALS",75:"OPEN_BLOCK_PARAMS",77:"CLOSE_BLOCK_PARAMS",80:"STRING",81:"NUMBER",82:"BOOLEAN",83:"UNDEFINED",84:"NULL",85:"DATA",87:"SEP"},
	productions_: [0,[3,2],[4,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[13,1],[10,3],[16,5],[9,4],[9,4],[24,6],[27,6],[38,6],[43,2],[45,3],[45,1],[26,3],[8,5],[8,5],[11,5],[12,3],[59,5],[63,1],[63,1],[64,5],[69,1],[71,3],[74,3],[20,1],[20,1],[20,1],[20,1],[20,1],[20,1],[20,1],[56,1],[56,1],[79,2],[78,1],[86,3],[86,1],[6,0],[6,2],[17,0],[17,2],[21,0],[21,2],[22,0],[22,1],[25,0],[25,1],[28,0],[28,1],[30,0],[30,2],[31,0],[31,1],[32,0],[32,1],[35,0],[35,2],[36,0],[36,1],[37,0],[37,1],[40,0],[40,2],[41,0],[41,1],[42,0],[42,1],[46,0],[46,1],[49,0],[49,2],[50,0],[50,1],[52,0],[52,2],[53,0],[53,1],[57,0],[57,2],[58,0],[58,1],[61,0],[61,2],[62,0],[62,1],[66,0],[66,2],[67,0],[67,1],[70,1],[70,2],[76,1],[76,2]],
	performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$
	) {

	var $0 = $$.length - 1;
	switch (yystate) {
	case 1: return $$[$0-1]; 
	break;
	case 2:this.$ = yy.prepareProgram($$[$0]);
	break;
	case 3:this.$ = $$[$0];
	break;
	case 4:this.$ = $$[$0];
	break;
	case 5:this.$ = $$[$0];
	break;
	case 6:this.$ = $$[$0];
	break;
	case 7:this.$ = $$[$0];
	break;
	case 8:this.$ = $$[$0];
	break;
	case 9:
	    this.$ = {
	      type: 'CommentStatement',
	      value: yy.stripComment($$[$0]),
	      strip: yy.stripFlags($$[$0], $$[$0]),
	      loc: yy.locInfo(this._$)
	    };
	  
	break;
	case 10:
	    this.$ = {
	      type: 'ContentStatement',
	      original: $$[$0],
	      value: $$[$0],
	      loc: yy.locInfo(this._$)
	    };
	  
	break;
	case 11:this.$ = yy.prepareRawBlock($$[$0-2], $$[$0-1], $$[$0], this._$);
	break;
	case 12:this.$ = { path: $$[$0-3], params: $$[$0-2], hash: $$[$0-1] };
	break;
	case 13:this.$ = yy.prepareBlock($$[$0-3], $$[$0-2], $$[$0-1], $$[$0], false, this._$);
	break;
	case 14:this.$ = yy.prepareBlock($$[$0-3], $$[$0-2], $$[$0-1], $$[$0], true, this._$);
	break;
	case 15:this.$ = { open: $$[$0-5], path: $$[$0-4], params: $$[$0-3], hash: $$[$0-2], blockParams: $$[$0-1], strip: yy.stripFlags($$[$0-5], $$[$0]) };
	break;
	case 16:this.$ = { path: $$[$0-4], params: $$[$0-3], hash: $$[$0-2], blockParams: $$[$0-1], strip: yy.stripFlags($$[$0-5], $$[$0]) };
	break;
	case 17:this.$ = { path: $$[$0-4], params: $$[$0-3], hash: $$[$0-2], blockParams: $$[$0-1], strip: yy.stripFlags($$[$0-5], $$[$0]) };
	break;
	case 18:this.$ = { strip: yy.stripFlags($$[$0-1], $$[$0-1]), program: $$[$0] };
	break;
	case 19:
	    var inverse = yy.prepareBlock($$[$0-2], $$[$0-1], $$[$0], $$[$0], false, this._$),
	        program = yy.prepareProgram([inverse], $$[$0-1].loc);
	    program.chained = true;

	    this.$ = { strip: $$[$0-2].strip, program: program, chain: true };
	  
	break;
	case 20:this.$ = $$[$0];
	break;
	case 21:this.$ = {path: $$[$0-1], strip: yy.stripFlags($$[$0-2], $$[$0])};
	break;
	case 22:this.$ = yy.prepareMustache($$[$0-3], $$[$0-2], $$[$0-1], $$[$0-4], yy.stripFlags($$[$0-4], $$[$0]), this._$);
	break;
	case 23:this.$ = yy.prepareMustache($$[$0-3], $$[$0-2], $$[$0-1], $$[$0-4], yy.stripFlags($$[$0-4], $$[$0]), this._$);
	break;
	case 24:
	    this.$ = {
	      type: 'PartialStatement',
	      name: $$[$0-3],
	      params: $$[$0-2],
	      hash: $$[$0-1],
	      indent: '',
	      strip: yy.stripFlags($$[$0-4], $$[$0]),
	      loc: yy.locInfo(this._$)
	    };
	  
	break;
	case 25:this.$ = yy.preparePartialBlock($$[$0-2], $$[$0-1], $$[$0], this._$);
	break;
	case 26:this.$ = { path: $$[$0-3], params: $$[$0-2], hash: $$[$0-1], strip: yy.stripFlags($$[$0-4], $$[$0]) };
	break;
	case 27:this.$ = $$[$0];
	break;
	case 28:this.$ = $$[$0];
	break;
	case 29:
	    this.$ = {
	      type: 'SubExpression',
	      path: $$[$0-3],
	      params: $$[$0-2],
	      hash: $$[$0-1],
	      loc: yy.locInfo(this._$)
	    };
	  
	break;
	case 30:this.$ = {type: 'Hash', pairs: $$[$0], loc: yy.locInfo(this._$)};
	break;
	case 31:this.$ = {type: 'HashPair', key: yy.id($$[$0-2]), value: $$[$0], loc: yy.locInfo(this._$)};
	break;
	case 32:this.$ = yy.id($$[$0-1]);
	break;
	case 33:this.$ = $$[$0];
	break;
	case 34:this.$ = $$[$0];
	break;
	case 35:this.$ = {type: 'StringLiteral', value: $$[$0], original: $$[$0], loc: yy.locInfo(this._$)};
	break;
	case 36:this.$ = {type: 'NumberLiteral', value: Number($$[$0]), original: Number($$[$0]), loc: yy.locInfo(this._$)};
	break;
	case 37:this.$ = {type: 'BooleanLiteral', value: $$[$0] === 'true', original: $$[$0] === 'true', loc: yy.locInfo(this._$)};
	break;
	case 38:this.$ = {type: 'UndefinedLiteral', original: undefined, value: undefined, loc: yy.locInfo(this._$)};
	break;
	case 39:this.$ = {type: 'NullLiteral', original: null, value: null, loc: yy.locInfo(this._$)};
	break;
	case 40:this.$ = $$[$0];
	break;
	case 41:this.$ = $$[$0];
	break;
	case 42:this.$ = yy.preparePath(true, $$[$0], this._$);
	break;
	case 43:this.$ = yy.preparePath(false, $$[$0], this._$);
	break;
	case 44: $$[$0-2].push({part: yy.id($$[$0]), original: $$[$0], separator: $$[$0-1]}); this.$ = $$[$0-2]; 
	break;
	case 45:this.$ = [{part: yy.id($$[$0]), original: $$[$0]}];
	break;
	case 46:this.$ = [];
	break;
	case 47:$$[$0-1].push($$[$0]);
	break;
	case 48:this.$ = [];
	break;
	case 49:$$[$0-1].push($$[$0]);
	break;
	case 50:this.$ = [];
	break;
	case 51:$$[$0-1].push($$[$0]);
	break;
	case 58:this.$ = [];
	break;
	case 59:$$[$0-1].push($$[$0]);
	break;
	case 64:this.$ = [];
	break;
	case 65:$$[$0-1].push($$[$0]);
	break;
	case 70:this.$ = [];
	break;
	case 71:$$[$0-1].push($$[$0]);
	break;
	case 78:this.$ = [];
	break;
	case 79:$$[$0-1].push($$[$0]);
	break;
	case 82:this.$ = [];
	break;
	case 83:$$[$0-1].push($$[$0]);
	break;
	case 86:this.$ = [];
	break;
	case 87:$$[$0-1].push($$[$0]);
	break;
	case 90:this.$ = [];
	break;
	case 91:$$[$0-1].push($$[$0]);
	break;
	case 94:this.$ = [];
	break;
	case 95:$$[$0-1].push($$[$0]);
	break;
	case 98:this.$ = [$$[$0]];
	break;
	case 99:$$[$0-1].push($$[$0]);
	break;
	case 100:this.$ = [$$[$0]];
	break;
	case 101:$$[$0-1].push($$[$0]);
	break;
	}
	},
	table: [{3:1,4:2,5:[2,46],6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{1:[3]},{5:[1,4]},{5:[2,2],7:5,8:6,9:7,10:8,11:9,12:10,13:11,14:[1,12],15:[1,20],16:17,19:[1,23],24:15,27:16,29:[1,21],34:[1,22],39:[2,2],44:[2,2],47:[2,2],48:[1,13],51:[1,14],55:[1,18],59:19,60:[1,24]},{1:[2,1]},{5:[2,47],14:[2,47],15:[2,47],19:[2,47],29:[2,47],34:[2,47],39:[2,47],44:[2,47],47:[2,47],48:[2,47],51:[2,47],55:[2,47],60:[2,47]},{5:[2,3],14:[2,3],15:[2,3],19:[2,3],29:[2,3],34:[2,3],39:[2,3],44:[2,3],47:[2,3],48:[2,3],51:[2,3],55:[2,3],60:[2,3]},{5:[2,4],14:[2,4],15:[2,4],19:[2,4],29:[2,4],34:[2,4],39:[2,4],44:[2,4],47:[2,4],48:[2,4],51:[2,4],55:[2,4],60:[2,4]},{5:[2,5],14:[2,5],15:[2,5],19:[2,5],29:[2,5],34:[2,5],39:[2,5],44:[2,5],47:[2,5],48:[2,5],51:[2,5],55:[2,5],60:[2,5]},{5:[2,6],14:[2,6],15:[2,6],19:[2,6],29:[2,6],34:[2,6],39:[2,6],44:[2,6],47:[2,6],48:[2,6],51:[2,6],55:[2,6],60:[2,6]},{5:[2,7],14:[2,7],15:[2,7],19:[2,7],29:[2,7],34:[2,7],39:[2,7],44:[2,7],47:[2,7],48:[2,7],51:[2,7],55:[2,7],60:[2,7]},{5:[2,8],14:[2,8],15:[2,8],19:[2,8],29:[2,8],34:[2,8],39:[2,8],44:[2,8],47:[2,8],48:[2,8],51:[2,8],55:[2,8],60:[2,8]},{5:[2,9],14:[2,9],15:[2,9],19:[2,9],29:[2,9],34:[2,9],39:[2,9],44:[2,9],47:[2,9],48:[2,9],51:[2,9],55:[2,9],60:[2,9]},{20:25,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:36,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{4:37,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],39:[2,46],44:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{4:38,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],44:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{15:[2,48],17:39,18:[2,48]},{20:41,56:40,64:42,65:[1,43],72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{4:44,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{5:[2,10],14:[2,10],15:[2,10],18:[2,10],19:[2,10],29:[2,10],34:[2,10],39:[2,10],44:[2,10],47:[2,10],48:[2,10],51:[2,10],55:[2,10],60:[2,10]},{20:45,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:46,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:47,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:41,56:48,64:42,65:[1,43],72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{33:[2,78],49:49,65:[2,78],72:[2,78],80:[2,78],81:[2,78],82:[2,78],83:[2,78],84:[2,78],85:[2,78]},{23:[2,33],33:[2,33],54:[2,33],65:[2,33],68:[2,33],72:[2,33],75:[2,33],80:[2,33],81:[2,33],82:[2,33],83:[2,33],84:[2,33],85:[2,33]},{23:[2,34],33:[2,34],54:[2,34],65:[2,34],68:[2,34],72:[2,34],75:[2,34],80:[2,34],81:[2,34],82:[2,34],83:[2,34],84:[2,34],85:[2,34]},{23:[2,35],33:[2,35],54:[2,35],65:[2,35],68:[2,35],72:[2,35],75:[2,35],80:[2,35],81:[2,35],82:[2,35],83:[2,35],84:[2,35],85:[2,35]},{23:[2,36],33:[2,36],54:[2,36],65:[2,36],68:[2,36],72:[2,36],75:[2,36],80:[2,36],81:[2,36],82:[2,36],83:[2,36],84:[2,36],85:[2,36]},{23:[2,37],33:[2,37],54:[2,37],65:[2,37],68:[2,37],72:[2,37],75:[2,37],80:[2,37],81:[2,37],82:[2,37],83:[2,37],84:[2,37],85:[2,37]},{23:[2,38],33:[2,38],54:[2,38],65:[2,38],68:[2,38],72:[2,38],75:[2,38],80:[2,38],81:[2,38],82:[2,38],83:[2,38],84:[2,38],85:[2,38]},{23:[2,39],33:[2,39],54:[2,39],65:[2,39],68:[2,39],72:[2,39],75:[2,39],80:[2,39],81:[2,39],82:[2,39],83:[2,39],84:[2,39],85:[2,39]},{23:[2,43],33:[2,43],54:[2,43],65:[2,43],68:[2,43],72:[2,43],75:[2,43],80:[2,43],81:[2,43],82:[2,43],83:[2,43],84:[2,43],85:[2,43],87:[1,50]},{72:[1,35],86:51},{23:[2,45],33:[2,45],54:[2,45],65:[2,45],68:[2,45],72:[2,45],75:[2,45],80:[2,45],81:[2,45],82:[2,45],83:[2,45],84:[2,45],85:[2,45],87:[2,45]},{52:52,54:[2,82],65:[2,82],72:[2,82],80:[2,82],81:[2,82],82:[2,82],83:[2,82],84:[2,82],85:[2,82]},{25:53,38:55,39:[1,57],43:56,44:[1,58],45:54,47:[2,54]},{28:59,43:60,44:[1,58],47:[2,56]},{13:62,15:[1,20],18:[1,61]},{33:[2,86],57:63,65:[2,86],72:[2,86],80:[2,86],81:[2,86],82:[2,86],83:[2,86],84:[2,86],85:[2,86]},{33:[2,40],65:[2,40],72:[2,40],80:[2,40],81:[2,40],82:[2,40],83:[2,40],84:[2,40],85:[2,40]},{33:[2,41],65:[2,41],72:[2,41],80:[2,41],81:[2,41],82:[2,41],83:[2,41],84:[2,41],85:[2,41]},{20:64,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{26:65,47:[1,66]},{30:67,33:[2,58],65:[2,58],72:[2,58],75:[2,58],80:[2,58],81:[2,58],82:[2,58],83:[2,58],84:[2,58],85:[2,58]},{33:[2,64],35:68,65:[2,64],72:[2,64],75:[2,64],80:[2,64],81:[2,64],82:[2,64],83:[2,64],84:[2,64],85:[2,64]},{21:69,23:[2,50],65:[2,50],72:[2,50],80:[2,50],81:[2,50],82:[2,50],83:[2,50],84:[2,50],85:[2,50]},{33:[2,90],61:70,65:[2,90],72:[2,90],80:[2,90],81:[2,90],82:[2,90],83:[2,90],84:[2,90],85:[2,90]},{20:74,33:[2,80],50:71,63:72,64:75,65:[1,43],69:73,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{72:[1,79]},{23:[2,42],33:[2,42],54:[2,42],65:[2,42],68:[2,42],72:[2,42],75:[2,42],80:[2,42],81:[2,42],82:[2,42],83:[2,42],84:[2,42],85:[2,42],87:[1,50]},{20:74,53:80,54:[2,84],63:81,64:75,65:[1,43],69:82,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{26:83,47:[1,66]},{47:[2,55]},{4:84,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],39:[2,46],44:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{47:[2,20]},{20:85,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{4:86,6:3,14:[2,46],15:[2,46],19:[2,46],29:[2,46],34:[2,46],47:[2,46],48:[2,46],51:[2,46],55:[2,46],60:[2,46]},{26:87,47:[1,66]},{47:[2,57]},{5:[2,11],14:[2,11],15:[2,11],19:[2,11],29:[2,11],34:[2,11],39:[2,11],44:[2,11],47:[2,11],48:[2,11],51:[2,11],55:[2,11],60:[2,11]},{15:[2,49],18:[2,49]},{20:74,33:[2,88],58:88,63:89,64:75,65:[1,43],69:90,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{65:[2,94],66:91,68:[2,94],72:[2,94],80:[2,94],81:[2,94],82:[2,94],83:[2,94],84:[2,94],85:[2,94]},{5:[2,25],14:[2,25],15:[2,25],19:[2,25],29:[2,25],34:[2,25],39:[2,25],44:[2,25],47:[2,25],48:[2,25],51:[2,25],55:[2,25],60:[2,25]},{20:92,72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:74,31:93,33:[2,60],63:94,64:75,65:[1,43],69:95,70:76,71:77,72:[1,78],75:[2,60],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:74,33:[2,66],36:96,63:97,64:75,65:[1,43],69:98,70:76,71:77,72:[1,78],75:[2,66],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:74,22:99,23:[2,52],63:100,64:75,65:[1,43],69:101,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{20:74,33:[2,92],62:102,63:103,64:75,65:[1,43],69:104,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{33:[1,105]},{33:[2,79],65:[2,79],72:[2,79],80:[2,79],81:[2,79],82:[2,79],83:[2,79],84:[2,79],85:[2,79]},{33:[2,81]},{23:[2,27],33:[2,27],54:[2,27],65:[2,27],68:[2,27],72:[2,27],75:[2,27],80:[2,27],81:[2,27],82:[2,27],83:[2,27],84:[2,27],85:[2,27]},{23:[2,28],33:[2,28],54:[2,28],65:[2,28],68:[2,28],72:[2,28],75:[2,28],80:[2,28],81:[2,28],82:[2,28],83:[2,28],84:[2,28],85:[2,28]},{23:[2,30],33:[2,30],54:[2,30],68:[2,30],71:106,72:[1,107],75:[2,30]},{23:[2,98],33:[2,98],54:[2,98],68:[2,98],72:[2,98],75:[2,98]},{23:[2,45],33:[2,45],54:[2,45],65:[2,45],68:[2,45],72:[2,45],73:[1,108],75:[2,45],80:[2,45],81:[2,45],82:[2,45],83:[2,45],84:[2,45],85:[2,45],87:[2,45]},{23:[2,44],33:[2,44],54:[2,44],65:[2,44],68:[2,44],72:[2,44],75:[2,44],80:[2,44],81:[2,44],82:[2,44],83:[2,44],84:[2,44],85:[2,44],87:[2,44]},{54:[1,109]},{54:[2,83],65:[2,83],72:[2,83],80:[2,83],81:[2,83],82:[2,83],83:[2,83],84:[2,83],85:[2,83]},{54:[2,85]},{5:[2,13],14:[2,13],15:[2,13],19:[2,13],29:[2,13],34:[2,13],39:[2,13],44:[2,13],47:[2,13],48:[2,13],51:[2,13],55:[2,13],60:[2,13]},{38:55,39:[1,57],43:56,44:[1,58],45:111,46:110,47:[2,76]},{33:[2,70],40:112,65:[2,70],72:[2,70],75:[2,70],80:[2,70],81:[2,70],82:[2,70],83:[2,70],84:[2,70],85:[2,70]},{47:[2,18]},{5:[2,14],14:[2,14],15:[2,14],19:[2,14],29:[2,14],34:[2,14],39:[2,14],44:[2,14],47:[2,14],48:[2,14],51:[2,14],55:[2,14],60:[2,14]},{33:[1,113]},{33:[2,87],65:[2,87],72:[2,87],80:[2,87],81:[2,87],82:[2,87],83:[2,87],84:[2,87],85:[2,87]},{33:[2,89]},{20:74,63:115,64:75,65:[1,43],67:114,68:[2,96],69:116,70:76,71:77,72:[1,78],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{33:[1,117]},{32:118,33:[2,62],74:119,75:[1,120]},{33:[2,59],65:[2,59],72:[2,59],75:[2,59],80:[2,59],81:[2,59],82:[2,59],83:[2,59],84:[2,59],85:[2,59]},{33:[2,61],75:[2,61]},{33:[2,68],37:121,74:122,75:[1,120]},{33:[2,65],65:[2,65],72:[2,65],75:[2,65],80:[2,65],81:[2,65],82:[2,65],83:[2,65],84:[2,65],85:[2,65]},{33:[2,67],75:[2,67]},{23:[1,123]},{23:[2,51],65:[2,51],72:[2,51],80:[2,51],81:[2,51],82:[2,51],83:[2,51],84:[2,51],85:[2,51]},{23:[2,53]},{33:[1,124]},{33:[2,91],65:[2,91],72:[2,91],80:[2,91],81:[2,91],82:[2,91],83:[2,91],84:[2,91],85:[2,91]},{33:[2,93]},{5:[2,22],14:[2,22],15:[2,22],19:[2,22],29:[2,22],34:[2,22],39:[2,22],44:[2,22],47:[2,22],48:[2,22],51:[2,22],55:[2,22],60:[2,22]},{23:[2,99],33:[2,99],54:[2,99],68:[2,99],72:[2,99],75:[2,99]},{73:[1,108]},{20:74,63:125,64:75,65:[1,43],72:[1,35],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{5:[2,23],14:[2,23],15:[2,23],19:[2,23],29:[2,23],34:[2,23],39:[2,23],44:[2,23],47:[2,23],48:[2,23],51:[2,23],55:[2,23],60:[2,23]},{47:[2,19]},{47:[2,77]},{20:74,33:[2,72],41:126,63:127,64:75,65:[1,43],69:128,70:76,71:77,72:[1,78],75:[2,72],78:26,79:27,80:[1,28],81:[1,29],82:[1,30],83:[1,31],84:[1,32],85:[1,34],86:33},{5:[2,24],14:[2,24],15:[2,24],19:[2,24],29:[2,24],34:[2,24],39:[2,24],44:[2,24],47:[2,24],48:[2,24],51:[2,24],55:[2,24],60:[2,24]},{68:[1,129]},{65:[2,95],68:[2,95],72:[2,95],80:[2,95],81:[2,95],82:[2,95],83:[2,95],84:[2,95],85:[2,95]},{68:[2,97]},{5:[2,21],14:[2,21],15:[2,21],19:[2,21],29:[2,21],34:[2,21],39:[2,21],44:[2,21],47:[2,21],48:[2,21],51:[2,21],55:[2,21],60:[2,21]},{33:[1,130]},{33:[2,63]},{72:[1,132],76:131},{33:[1,133]},{33:[2,69]},{15:[2,12],18:[2,12]},{14:[2,26],15:[2,26],19:[2,26],29:[2,26],34:[2,26],47:[2,26],48:[2,26],51:[2,26],55:[2,26],60:[2,26]},{23:[2,31],33:[2,31],54:[2,31],68:[2,31],72:[2,31],75:[2,31]},{33:[2,74],42:134,74:135,75:[1,120]},{33:[2,71],65:[2,71],72:[2,71],75:[2,71],80:[2,71],81:[2,71],82:[2,71],83:[2,71],84:[2,71],85:[2,71]},{33:[2,73],75:[2,73]},{23:[2,29],33:[2,29],54:[2,29],65:[2,29],68:[2,29],72:[2,29],75:[2,29],80:[2,29],81:[2,29],82:[2,29],83:[2,29],84:[2,29],85:[2,29]},{14:[2,15],15:[2,15],19:[2,15],29:[2,15],34:[2,15],39:[2,15],44:[2,15],47:[2,15],48:[2,15],51:[2,15],55:[2,15],60:[2,15]},{72:[1,137],77:[1,136]},{72:[2,100],77:[2,100]},{14:[2,16],15:[2,16],19:[2,16],29:[2,16],34:[2,16],44:[2,16],47:[2,16],48:[2,16],51:[2,16],55:[2,16],60:[2,16]},{33:[1,138]},{33:[2,75]},{33:[2,32]},{72:[2,101],77:[2,101]},{14:[2,17],15:[2,17],19:[2,17],29:[2,17],34:[2,17],39:[2,17],44:[2,17],47:[2,17],48:[2,17],51:[2,17],55:[2,17],60:[2,17]}],
	defaultActions: {4:[2,1],54:[2,55],56:[2,20],60:[2,57],73:[2,81],82:[2,85],86:[2,18],90:[2,89],101:[2,53],104:[2,93],110:[2,19],111:[2,77],116:[2,97],119:[2,63],122:[2,69],135:[2,75],136:[2,32]},
	parseError: function parseError (str, hash) {
	    throw new Error(str);
	},
	parse: function parse(input) {
	    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0;
	    this.lexer.setInput(input);
	    this.lexer.yy = this.yy;
	    this.yy.lexer = this.lexer;
	    this.yy.parser = this;
	    if (typeof this.lexer.yylloc == "undefined")
	        this.lexer.yylloc = {};
	    var yyloc = this.lexer.yylloc;
	    lstack.push(yyloc);
	    var ranges = this.lexer.options && this.lexer.options.ranges;
	    if (typeof this.yy.parseError === "function")
	        this.parseError = this.yy.parseError;
	    function lex() {
	        var token;
	        token = self.lexer.lex() || 1;
	        if (typeof token !== "number") {
	            token = self.symbols_[token] || token;
	        }
	        return token;
	    }
	    var symbol, preErrorSymbol, state, action, r, yyval = {}, p, len, newState, expected;
	    while (true) {
	        state = stack[stack.length - 1];
	        if (this.defaultActions[state]) {
	            action = this.defaultActions[state];
	        } else {
	            if (symbol === null || typeof symbol == "undefined") {
	                symbol = lex();
	            }
	            action = table[state] && table[state][symbol];
	        }
	        if (typeof action === "undefined" || !action.length || !action[0]) {
	            var errStr = "";
	            if (!recovering) {
	                expected = [];
	                for (p in table[state])
	                    if (this.terminals_[p] && p > 2) {
	                        expected.push("'" + this.terminals_[p] + "'");
	                    }
	                if (this.lexer.showPosition) {
	                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
	                } else {
	                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
	                }
	                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
	            }
	        }
	        if (action[0] instanceof Array && action.length > 1) {
	            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
	        }
	        switch (action[0]) {
	        case 1:
	            stack.push(symbol);
	            vstack.push(this.lexer.yytext);
	            lstack.push(this.lexer.yylloc);
	            stack.push(action[1]);
	            symbol = null;
	            if (!preErrorSymbol) {
	                yyleng = this.lexer.yyleng;
	                yytext = this.lexer.yytext;
	                yylineno = this.lexer.yylineno;
	                yyloc = this.lexer.yylloc;
	                if (recovering > 0)
	                    recovering--;
	            } else {
	                symbol = preErrorSymbol;
	                preErrorSymbol = null;
	            }
	            break;
	        case 2:
	            len = this.productions_[action[1]][1];
	            yyval.$ = vstack[vstack.length - len];
	            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
	            if (ranges) {
	                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
	            }
	            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
	            if (typeof r !== "undefined") {
	                return r;
	            }
	            if (len) {
	                stack = stack.slice(0, -1 * len * 2);
	                vstack = vstack.slice(0, -1 * len);
	                lstack = lstack.slice(0, -1 * len);
	            }
	            stack.push(this.productions_[action[1]][0]);
	            vstack.push(yyval.$);
	            lstack.push(yyval._$);
	            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
	            stack.push(newState);
	            break;
	        case 3:
	            return true;
	        }
	    }
	    return true;
	}
	};
	/* Jison generated lexer */
	var lexer = (function(){
	var lexer = ({EOF:1,
	parseError:function parseError(str, hash) {
	        if (this.yy.parser) {
	            this.yy.parser.parseError(str, hash);
	        } else {
	            throw new Error(str);
	        }
	    },
	setInput:function (input) {
	        this._input = input;
	        this._more = this._less = this.done = false;
	        this.yylineno = this.yyleng = 0;
	        this.yytext = this.matched = this.match = '';
	        this.conditionStack = ['INITIAL'];
	        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
	        if (this.options.ranges) this.yylloc.range = [0,0];
	        this.offset = 0;
	        return this;
	    },
	input:function () {
	        var ch = this._input[0];
	        this.yytext += ch;
	        this.yyleng++;
	        this.offset++;
	        this.match += ch;
	        this.matched += ch;
	        var lines = ch.match(/(?:\r\n?|\n).*/g);
	        if (lines) {
	            this.yylineno++;
	            this.yylloc.last_line++;
	        } else {
	            this.yylloc.last_column++;
	        }
	        if (this.options.ranges) this.yylloc.range[1]++;

	        this._input = this._input.slice(1);
	        return ch;
	    },
	unput:function (ch) {
	        var len = ch.length;
	        var lines = ch.split(/(?:\r\n?|\n)/g);

	        this._input = ch + this._input;
	        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
	        //this.yyleng -= len;
	        this.offset -= len;
	        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
	        this.match = this.match.substr(0, this.match.length-1);
	        this.matched = this.matched.substr(0, this.matched.length-1);

	        if (lines.length-1) this.yylineno -= lines.length-1;
	        var r = this.yylloc.range;

	        this.yylloc = {first_line: this.yylloc.first_line,
	          last_line: this.yylineno+1,
	          first_column: this.yylloc.first_column,
	          last_column: lines ?
	              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
	              this.yylloc.first_column - len
	          };

	        if (this.options.ranges) {
	            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
	        }
	        return this;
	    },
	more:function () {
	        this._more = true;
	        return this;
	    },
	less:function (n) {
	        this.unput(this.match.slice(n));
	    },
	pastInput:function () {
	        var past = this.matched.substr(0, this.matched.length - this.match.length);
	        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
	    },
	upcomingInput:function () {
	        var next = this.match;
	        if (next.length < 20) {
	            next += this._input.substr(0, 20-next.length);
	        }
	        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
	    },
	showPosition:function () {
	        var pre = this.pastInput();
	        var c = new Array(pre.length + 1).join("-");
	        return pre + this.upcomingInput() + "\n" + c+"^";
	    },
	next:function () {
	        if (this.done) {
	            return this.EOF;
	        }
	        if (!this._input) this.done = true;

	        var token,
	            match,
	            tempMatch,
	            index,
	            lines;
	        if (!this._more) {
	            this.yytext = '';
	            this.match = '';
	        }
	        var rules = this._currentRules();
	        for (var i=0;i < rules.length; i++) {
	            tempMatch = this._input.match(this.rules[rules[i]]);
	            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
	                match = tempMatch;
	                index = i;
	                if (!this.options.flex) break;
	            }
	        }
	        if (match) {
	            lines = match[0].match(/(?:\r\n?|\n).*/g);
	            if (lines) this.yylineno += lines.length;
	            this.yylloc = {first_line: this.yylloc.last_line,
	                           last_line: this.yylineno+1,
	                           first_column: this.yylloc.last_column,
	                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
	            this.yytext += match[0];
	            this.match += match[0];
	            this.matches = match;
	            this.yyleng = this.yytext.length;
	            if (this.options.ranges) {
	                this.yylloc.range = [this.offset, this.offset += this.yyleng];
	            }
	            this._more = false;
	            this._input = this._input.slice(match[0].length);
	            this.matched += match[0];
	            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
	            if (this.done && this._input) this.done = false;
	            if (token) return token;
	            else return;
	        }
	        if (this._input === "") {
	            return this.EOF;
	        } else {
	            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
	                    {text: "", token: null, line: this.yylineno});
	        }
	    },
	lex:function lex () {
	        var r = this.next();
	        if (typeof r !== 'undefined') {
	            return r;
	        } else {
	            return this.lex();
	        }
	    },
	begin:function begin (condition) {
	        this.conditionStack.push(condition);
	    },
	popState:function popState () {
	        return this.conditionStack.pop();
	    },
	_currentRules:function _currentRules () {
	        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
	    },
	topState:function () {
	        return this.conditionStack[this.conditionStack.length-2];
	    },
	pushState:function begin (condition) {
	        this.begin(condition);
	    }});
	lexer.options = {};
	lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START
	) {


	function strip(start, end) {
	  return yy_.yytext = yy_.yytext.substring(start, yy_.yyleng - end + start);
	}
	switch($avoiding_name_collisions) {
	case 0:
	                                   if(yy_.yytext.slice(-2) === "\\\\") {
	                                     strip(0,1);
	                                     this.begin("mu");
	                                   } else if(yy_.yytext.slice(-1) === "\\") {
	                                     strip(0,1);
	                                     this.begin("emu");
	                                   } else {
	                                     this.begin("mu");
	                                   }
	                                   if(yy_.yytext) return 15;
	                                 
	break;
	case 1:return 15;
	break;
	case 2:
	                                   this.popState();
	                                   return 15;
	                                 
	break;
	case 3:this.begin('raw'); return 15;
	break;
	case 4:
	                                  this.popState();
	                                  // Should be using `this.topState()` below, but it currently
	                                  // returns the second top instead of the first top. Opened an
	                                  // issue about it at https://github.com/zaach/jison/issues/291
	                                  if (this.conditionStack[this.conditionStack.length-1] === 'raw') {
	                                    return 15;
	                                  } else {
	                                    strip(5, 9);
	                                    return 'END_RAW_BLOCK';
	                                  }
	                                 
	break;
	case 5: return 15; 
	break;
	case 6:
	  this.popState();
	  return 14;

	break;
	case 7:return 65;
	break;
	case 8:return 68;
	break;
	case 9: return 19; 
	break;
	case 10:
	                                  this.popState();
	                                  this.begin('raw');
	                                  return 23;
	                                 
	break;
	case 11:return 55;
	break;
	case 12:return 60;
	break;
	case 13:return 29;
	break;
	case 14:return 47;
	break;
	case 15:this.popState(); return 44;
	break;
	case 16:this.popState(); return 44;
	break;
	case 17:return 34;
	break;
	case 18:return 39;
	break;
	case 19:return 51;
	break;
	case 20:return 48;
	break;
	case 21:
	  this.unput(yy_.yytext);
	  this.popState();
	  this.begin('com');

	break;
	case 22:
	  this.popState();
	  return 14;

	break;
	case 23:return 48;
	break;
	case 24:return 73;
	break;
	case 25:return 72;
	break;
	case 26:return 72;
	break;
	case 27:return 87;
	break;
	case 28:// ignore whitespace
	break;
	case 29:this.popState(); return 54;
	break;
	case 30:this.popState(); return 33;
	break;
	case 31:yy_.yytext = strip(1,2).replace(/\\"/g,'"'); return 80;
	break;
	case 32:yy_.yytext = strip(1,2).replace(/\\'/g,"'"); return 80;
	break;
	case 33:return 85;
	break;
	case 34:return 82;
	break;
	case 35:return 82;
	break;
	case 36:return 83;
	break;
	case 37:return 84;
	break;
	case 38:return 81;
	break;
	case 39:return 75;
	break;
	case 40:return 77;
	break;
	case 41:return 72;
	break;
	case 42:yy_.yytext = yy_.yytext.replace(/\\([\\\]])/g,'$1'); return 72;
	break;
	case 43:return 'INVALID';
	break;
	case 44:return 5;
	break;
	}
	};
	lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,/^(?:\{\{\{\{(?=[^\/]))/,/^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/,/^(?:[^\x00]+?(?=(\{\{\{\{)))/,/^(?:[\s\S]*?--(~)?\}\})/,/^(?:\()/,/^(?:\))/,/^(?:\{\{\{\{)/,/^(?:\}\}\}\})/,/^(?:\{\{(~)?>)/,/^(?:\{\{(~)?#>)/,/^(?:\{\{(~)?#\*?)/,/^(?:\{\{(~)?\/)/,/^(?:\{\{(~)?\^\s*(~)?\}\})/,/^(?:\{\{(~)?\s*else\s*(~)?\}\})/,/^(?:\{\{(~)?\^)/,/^(?:\{\{(~)?\s*else\b)/,/^(?:\{\{(~)?\{)/,/^(?:\{\{(~)?&)/,/^(?:\{\{(~)?!--)/,/^(?:\{\{(~)?![\s\S]*?\}\})/,/^(?:\{\{(~)?\*?)/,/^(?:=)/,/^(?:\.\.)/,/^(?:\.(?=([=~}\s\/.)|])))/,/^(?:[\/.])/,/^(?:\s+)/,/^(?:\}(~)?\}\})/,/^(?:(~)?\}\})/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:@)/,/^(?:true(?=([~}\s)])))/,/^(?:false(?=([~}\s)])))/,/^(?:undefined(?=([~}\s)])))/,/^(?:null(?=([~}\s)])))/,/^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/,/^(?:as\s+\|)/,/^(?:\|)/,/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/,/^(?:\[(\\\]|[^\]])*\])/,/^(?:.)/,/^(?:$)/];
	lexer.conditions = {"mu":{"rules":[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44],"inclusive":false},"emu":{"rules":[2],"inclusive":false},"com":{"rules":[6],"inclusive":false},"raw":{"rules":[3,4,5],"inclusive":false},"INITIAL":{"rules":[0,1,44],"inclusive":true}};
	return lexer;})();
	parser.lexer = lexer;
	function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
	return new Parser;
	})();

	function Visitor() {
	  this.parents = [];
	}

	Visitor.prototype = {
	  constructor: Visitor,
	  mutating: false,

	  // Visits a given value. If mutating, will replace the value if necessary.
	  acceptKey: function(node, name) {
	    let value = this.accept(node[name]);
	    if (this.mutating) {
	      // Hacky sanity check: This may have a few false positives for type for the helper
	      // methods but will generally do the right thing without a lot of overhead.
	      if (value && !Visitor.prototype[value.type]) {
	        throw new Exception(
	          'Unexpected node type "' +
	            value.type +
	            '" found when accepting ' +
	            name +
	            ' on ' +
	            node.type
	        );
	      }
	      node[name] = value;
	    }
	  },

	  // Performs an accept operation with added sanity check to ensure
	  // required keys are not removed.
	  acceptRequired: function(node, name) {
	    this.acceptKey(node, name);

	    if (!node[name]) {
	      throw new Exception(node.type + ' requires ' + name);
	    }
	  },

	  // Traverses a given array. If mutating, empty respnses will be removed
	  // for child elements.
	  acceptArray: function(array) {
	    for (let i = 0, l = array.length; i < l; i++) {
	      this.acceptKey(array, i);

	      if (!array[i]) {
	        array.splice(i, 1);
	        i--;
	        l--;
	      }
	    }
	  },

	  accept: function(object) {
	    if (!object) {
	      return;
	    }

	    /* istanbul ignore next: Sanity code */
	    if (!this[object.type]) {
	      throw new Exception('Unknown type: ' + object.type, object);
	    }

	    if (this.current) {
	      this.parents.unshift(this.current);
	    }
	    this.current = object;

	    let ret = this[object.type](object);

	    this.current = this.parents.shift();

	    if (!this.mutating || ret) {
	      return ret;
	    } else if (ret !== false) {
	      return object;
	    }
	  },

	  Program: function(program) {
	    this.acceptArray(program.body);
	  },

	  MustacheStatement: visitSubExpression,
	  Decorator: visitSubExpression,

	  BlockStatement: visitBlock,
	  DecoratorBlock: visitBlock,

	  PartialStatement: visitPartial,
	  PartialBlockStatement: function(partial) {
	    visitPartial.call(this, partial);

	    this.acceptKey(partial, 'program');
	  },

	  ContentStatement: function(/* content */) {},
	  CommentStatement: function(/* comment */) {},

	  SubExpression: visitSubExpression,

	  PathExpression: function(/* path */) {},

	  StringLiteral: function(/* string */) {},
	  NumberLiteral: function(/* number */) {},
	  BooleanLiteral: function(/* bool */) {},
	  UndefinedLiteral: function(/* literal */) {},
	  NullLiteral: function(/* literal */) {},

	  Hash: function(hash) {
	    this.acceptArray(hash.pairs);
	  },
	  HashPair: function(pair) {
	    this.acceptRequired(pair, 'value');
	  }
	};

	function visitSubExpression(mustache) {
	  this.acceptRequired(mustache, 'path');
	  this.acceptArray(mustache.params);
	  this.acceptKey(mustache, 'hash');
	}
	function visitBlock(block) {
	  visitSubExpression.call(this, block);

	  this.acceptKey(block, 'program');
	  this.acceptKey(block, 'inverse');
	}
	function visitPartial(partial) {
	  this.acceptRequired(partial, 'name');
	  this.acceptArray(partial.params);
	  this.acceptKey(partial, 'hash');
	}

	function WhitespaceControl(options = {}) {
	  this.options = options;
	}
	WhitespaceControl.prototype = new Visitor();

	WhitespaceControl.prototype.Program = function(program) {
	  const doStandalone = !this.options.ignoreStandalone;

	  let isRoot = !this.isRootSeen;
	  this.isRootSeen = true;

	  let body = program.body;
	  for (let i = 0, l = body.length; i < l; i++) {
	    let current = body[i],
	      strip = this.accept(current);

	    if (!strip) {
	      continue;
	    }

	    let _isPrevWhitespace = isPrevWhitespace(body, i, isRoot),
	      _isNextWhitespace = isNextWhitespace(body, i, isRoot),
	      openStandalone = strip.openStandalone && _isPrevWhitespace,
	      closeStandalone = strip.closeStandalone && _isNextWhitespace,
	      inlineStandalone =
	        strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;

	    if (strip.close) {
	      omitRight(body, i, true);
	    }
	    if (strip.open) {
	      omitLeft(body, i, true);
	    }

	    if (doStandalone && inlineStandalone) {
	      omitRight(body, i);

	      if (omitLeft(body, i)) {
	        // If we are on a standalone node, save the indent info for partials
	        if (current.type === 'PartialStatement') {
	          // Pull out the whitespace from the final line
	          current.indent = /([ \t]+$)/.exec(body[i - 1].original)[1];
	        }
	      }
	    }
	    if (doStandalone && openStandalone) {
	      omitRight((current.program || current.inverse).body);

	      // Strip out the previous content node if it's whitespace only
	      omitLeft(body, i);
	    }
	    if (doStandalone && closeStandalone) {
	      // Always strip the next node
	      omitRight(body, i);

	      omitLeft((current.inverse || current.program).body);
	    }
	  }

	  return program;
	};

	WhitespaceControl.prototype.BlockStatement = WhitespaceControl.prototype.DecoratorBlock = WhitespaceControl.prototype.PartialBlockStatement = function(
	  block
	) {
	  this.accept(block.program);
	  this.accept(block.inverse);

	  // Find the inverse program that is involed with whitespace stripping.
	  let program = block.program || block.inverse,
	    inverse = block.program && block.inverse,
	    firstInverse = inverse,
	    lastInverse = inverse;

	  if (inverse && inverse.chained) {
	    firstInverse = inverse.body[0].program;

	    // Walk the inverse chain to find the last inverse that is actually in the chain.
	    while (lastInverse.chained) {
	      lastInverse = lastInverse.body[lastInverse.body.length - 1].program;
	    }
	  }

	  let strip = {
	    open: block.openStrip.open,
	    close: block.closeStrip.close,

	    // Determine the standalone candiacy. Basically flag our content as being possibly standalone
	    // so our parent can determine if we actually are standalone
	    openStandalone: isNextWhitespace(program.body),
	    closeStandalone: isPrevWhitespace((firstInverse || program).body)
	  };

	  if (block.openStrip.close) {
	    omitRight(program.body, null, true);
	  }

	  if (inverse) {
	    let inverseStrip = block.inverseStrip;

	    if (inverseStrip.open) {
	      omitLeft(program.body, null, true);
	    }

	    if (inverseStrip.close) {
	      omitRight(firstInverse.body, null, true);
	    }
	    if (block.closeStrip.open) {
	      omitLeft(lastInverse.body, null, true);
	    }

	    // Find standalone else statments
	    if (
	      !this.options.ignoreStandalone &&
	      isPrevWhitespace(program.body) &&
	      isNextWhitespace(firstInverse.body)
	    ) {
	      omitLeft(program.body);
	      omitRight(firstInverse.body);
	    }
	  } else if (block.closeStrip.open) {
	    omitLeft(program.body, null, true);
	  }

	  return strip;
	};

	WhitespaceControl.prototype.Decorator = WhitespaceControl.prototype.MustacheStatement = function(
	  mustache
	) {
	  return mustache.strip;
	};

	WhitespaceControl.prototype.PartialStatement = WhitespaceControl.prototype.CommentStatement = function(
	  node
	) {
	  /* istanbul ignore next */
	  let strip = node.strip || {};
	  return {
	    inlineStandalone: true,
	    open: strip.open,
	    close: strip.close
	  };
	};

	function isPrevWhitespace(body, i, isRoot) {
	  if (i === undefined) {
	    i = body.length;
	  }

	  // Nodes that end with newlines are considered whitespace (but are special
	  // cased for strip operations)
	  let prev = body[i - 1],
	    sibling = body[i - 2];
	  if (!prev) {
	    return isRoot;
	  }

	  if (prev.type === 'ContentStatement') {
	    return (sibling || !isRoot ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(
	      prev.original
	    );
	  }
	}
	function isNextWhitespace(body, i, isRoot) {
	  if (i === undefined) {
	    i = -1;
	  }

	  let next = body[i + 1],
	    sibling = body[i + 2];
	  if (!next) {
	    return isRoot;
	  }

	  if (next.type === 'ContentStatement') {
	    return (sibling || !isRoot ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(
	      next.original
	    );
	  }
	}

	// Marks the node to the right of the position as omitted.
	// I.e. {{foo}}' ' will mark the ' ' node as omitted.
	//
	// If i is undefined, then the first child will be marked as such.
	//
	// If mulitple is truthy then all whitespace will be stripped out until non-whitespace
	// content is met.
	function omitRight(body, i, multiple) {
	  let current = body[i == null ? 0 : i + 1];
	  if (
	    !current ||
	    current.type !== 'ContentStatement' ||
	    (!multiple && current.rightStripped)
	  ) {
	    return;
	  }

	  let original = current.value;
	  current.value = current.value.replace(
	    multiple ? /^\s+/ : /^[ \t]*\r?\n?/,
	    ''
	  );
	  current.rightStripped = current.value !== original;
	}

	// Marks the node to the left of the position as omitted.
	// I.e. ' '{{foo}} will mark the ' ' node as omitted.
	//
	// If i is undefined then the last child will be marked as such.
	//
	// If mulitple is truthy then all whitespace will be stripped out until non-whitespace
	// content is met.
	function omitLeft(body, i, multiple) {
	  let current = body[i == null ? body.length - 1 : i - 1];
	  if (
	    !current ||
	    current.type !== 'ContentStatement' ||
	    (!multiple && current.leftStripped)
	  ) {
	    return;
	  }

	  // We omit the last node if it's whitespace only and not preceded by a non-content node.
	  let original = current.value;
	  current.value = current.value.replace(multiple ? /\s+$/ : /[ \t]+$/, '');
	  current.leftStripped = current.value !== original;
	  return current.leftStripped;
	}

	function validateClose(open, close) {
	  close = close.path ? close.path.original : close;

	  if (open.path.original !== close) {
	    let errorNode = { loc: open.path.loc };

	    throw new Exception(
	      open.path.original + " doesn't match " + close,
	      errorNode
	    );
	  }
	}

	function SourceLocation(source, locInfo) {
	  this.source = source;
	  this.start = {
	    line: locInfo.first_line,
	    column: locInfo.first_column
	  };
	  this.end = {
	    line: locInfo.last_line,
	    column: locInfo.last_column
	  };
	}

	function id(token) {
	  if (/^\[.*\]$/.test(token)) {
	    return token.substring(1, token.length - 1);
	  } else {
	    return token;
	  }
	}

	function stripFlags(open, close) {
	  return {
	    open: open.charAt(2) === '~',
	    close: close.charAt(close.length - 3) === '~'
	  };
	}

	function stripComment(comment) {
	  return comment.replace(/^\{\{~?!-?-?/, '').replace(/-?-?~?\}\}$/, '');
	}

	function preparePath(data, parts, loc) {
	  loc = this.locInfo(loc);

	  let original = data ? '@' : '',
	    dig = [],
	    depth = 0;

	  for (let i = 0, l = parts.length; i < l; i++) {
	    let part = parts[i].part,
	      // If we have [] syntax then we do not treat path references as operators,
	      // i.e. foo.[this] resolves to approximately context.foo['this']
	      isLiteral = parts[i].original !== part;
	    original += (parts[i].separator || '') + part;

	    if (!isLiteral && (part === '..' || part === '.' || part === 'this')) {
	      if (dig.length > 0) {
	        throw new Exception('Invalid path: ' + original, { loc });
	      } else if (part === '..') {
	        depth++;
	      }
	    } else {
	      dig.push(part);
	    }
	  }

	  return {
	    type: 'PathExpression',
	    data,
	    depth,
	    parts: dig,
	    original,
	    loc
	  };
	}

	function prepareMustache(path, params, hash, open, strip, locInfo) {
	  // Must use charAt to support IE pre-10
	  let escapeFlag = open.charAt(3) || open.charAt(2),
	    escaped = escapeFlag !== '{' && escapeFlag !== '&';

	  let decorator = /\*/.test(open);
	  return {
	    type: decorator ? 'Decorator' : 'MustacheStatement',
	    path,
	    params,
	    hash,
	    escaped,
	    strip,
	    loc: this.locInfo(locInfo)
	  };
	}

	function prepareRawBlock(openRawBlock, contents, close, locInfo) {
	  validateClose(openRawBlock, close);

	  locInfo = this.locInfo(locInfo);
	  let program = {
	    type: 'Program',
	    body: contents,
	    strip: {},
	    loc: locInfo
	  };

	  return {
	    type: 'BlockStatement',
	    path: openRawBlock.path,
	    params: openRawBlock.params,
	    hash: openRawBlock.hash,
	    program,
	    openStrip: {},
	    inverseStrip: {},
	    closeStrip: {},
	    loc: locInfo
	  };
	}

	function prepareBlock(
	  openBlock,
	  program,
	  inverseAndProgram,
	  close,
	  inverted,
	  locInfo
	) {
	  if (close && close.path) {
	    validateClose(openBlock, close);
	  }

	  let decorator = /\*/.test(openBlock.open);

	  program.blockParams = openBlock.blockParams;

	  let inverse, inverseStrip;

	  if (inverseAndProgram) {
	    if (decorator) {
	      throw new Exception(
	        'Unexpected inverse block on decorator',
	        inverseAndProgram
	      );
	    }

	    if (inverseAndProgram.chain) {
	      inverseAndProgram.program.body[0].closeStrip = close.strip;
	    }

	    inverseStrip = inverseAndProgram.strip;
	    inverse = inverseAndProgram.program;
	  }

	  if (inverted) {
	    inverted = inverse;
	    inverse = program;
	    program = inverted;
	  }

	  return {
	    type: decorator ? 'DecoratorBlock' : 'BlockStatement',
	    path: openBlock.path,
	    params: openBlock.params,
	    hash: openBlock.hash,
	    program,
	    inverse,
	    openStrip: openBlock.strip,
	    inverseStrip,
	    closeStrip: close && close.strip,
	    loc: this.locInfo(locInfo)
	  };
	}

	function prepareProgram(statements, loc) {
	  if (!loc && statements.length) {
	    const firstLoc = statements[0].loc,
	      lastLoc = statements[statements.length - 1].loc;

	    /* istanbul ignore else */
	    if (firstLoc && lastLoc) {
	      loc = {
	        source: firstLoc.source,
	        start: {
	          line: firstLoc.start.line,
	          column: firstLoc.start.column
	        },
	        end: {
	          line: lastLoc.end.line,
	          column: lastLoc.end.column
	        }
	      };
	    }
	  }

	  return {
	    type: 'Program',
	    body: statements,
	    strip: {},
	    loc: loc
	  };
	}

	function preparePartialBlock(open, program, close, locInfo) {
	  validateClose(open, close);

	  return {
	    type: 'PartialBlockStatement',
	    name: open.path,
	    params: open.params,
	    hash: open.hash,
	    program,
	    openStrip: open.strip,
	    closeStrip: close && close.strip,
	    loc: this.locInfo(locInfo)
	  };
	}

	var Helpers = /*#__PURE__*/Object.freeze({
		SourceLocation: SourceLocation,
		id: id,
		stripFlags: stripFlags,
		stripComment: stripComment,
		preparePath: preparePath,
		prepareMustache: prepareMustache,
		prepareRawBlock: prepareRawBlock,
		prepareBlock: prepareBlock,
		prepareProgram: prepareProgram,
		preparePartialBlock: preparePartialBlock
	});

	let yy = {};
	extend$1(yy, Helpers);

	function parseWithoutProcessing(input, options) {
	  // Just return if an already-compiled AST was passed in.
	  if (input.type === 'Program') {
	    return input;
	  }

	  handlebars.yy = yy;

	  // Altering the shared object here, but this is ok as parser is a sync operation
	  yy.locInfo = function(locInfo) {
	    return new yy.SourceLocation(options && options.srcName, locInfo);
	  };

	  let ast = handlebars.parse(input);

	  return ast;
	}

	function parse(input, options) {
	  let ast = parseWithoutProcessing(input, options);
	  let strip = new WhitespaceControl(options);

	  return strip.accept(ast);
	}

	/* eslint-disable new-cap */

	const slice = [].slice;

	function Compiler() {}

	// the foundHelper register will disambiguate helper lookup from finding a
	// function in a context. This is necessary for mustache compatibility, which
	// requires that context functions in blocks are evaluated by blockHelperMissing,
	// and then proceed as if the resulting value was provided to blockHelperMissing.

	Compiler.prototype = {
	  compiler: Compiler,

	  equals: function(other) {
	    let len = this.opcodes.length;
	    if (other.opcodes.length !== len) {
	      return false;
	    }

	    for (let i = 0; i < len; i++) {
	      let opcode = this.opcodes[i],
	        otherOpcode = other.opcodes[i];
	      if (
	        opcode.opcode !== otherOpcode.opcode ||
	        !argEquals(opcode.args, otherOpcode.args)
	      ) {
	        return false;
	      }
	    }

	    // We know that length is the same between the two arrays because they are directly tied
	    // to the opcode behavior above.
	    len = this.children.length;
	    for (let i = 0; i < len; i++) {
	      if (!this.children[i].equals(other.children[i])) {
	        return false;
	      }
	    }

	    return true;
	  },

	  guid: 0,

	  compile: function(program, options) {
	    this.sourceNode = [];
	    this.opcodes = [];
	    this.children = [];
	    this.options = options;
	    this.stringParams = options.stringParams;
	    this.trackIds = options.trackIds;

	    options.blockParams = options.blockParams || [];

	    options.knownHelpers = extend$1(
	      Object.create(null),
	      {
	        helperMissing: true,
	        blockHelperMissing: true,
	        each: true,
	        if: true,
	        unless: true,
	        with: true,
	        log: true,
	        lookup: true
	      },
	      options.knownHelpers
	    );

	    return this.accept(program);
	  },

	  compileProgram: function(program) {
	    let childCompiler = new this.compiler(), // eslint-disable-line new-cap
	      result = childCompiler.compile(program, this.options),
	      guid = this.guid++;

	    this.usePartial = this.usePartial || result.usePartial;

	    this.children[guid] = result;
	    this.useDepths = this.useDepths || result.useDepths;

	    return guid;
	  },

	  accept: function(node) {
	    /* istanbul ignore next: Sanity code */
	    if (!this[node.type]) {
	      throw new Exception('Unknown type: ' + node.type, node);
	    }

	    this.sourceNode.unshift(node);
	    let ret = this[node.type](node);
	    this.sourceNode.shift();
	    return ret;
	  },

	  Program: function(program) {
	    this.options.blockParams.unshift(program.blockParams);

	    let body = program.body,
	      bodyLength = body.length;
	    for (let i = 0; i < bodyLength; i++) {
	      this.accept(body[i]);
	    }

	    this.options.blockParams.shift();

	    this.isSimple = bodyLength === 1;
	    this.blockParams = program.blockParams ? program.blockParams.length : 0;

	    return this;
	  },

	  BlockStatement: function(block) {
	    transformLiteralToPath(block);

	    let program = block.program,
	      inverse = block.inverse;

	    program = program && this.compileProgram(program);
	    inverse = inverse && this.compileProgram(inverse);

	    let type = this.classifySexpr(block);

	    if (type === 'helper') {
	      this.helperSexpr(block, program, inverse);
	    } else if (type === 'simple') {
	      this.simpleSexpr(block);

	      // now that the simple mustache is resolved, we need to
	      // evaluate it by executing `blockHelperMissing`
	      this.opcode('pushProgram', program);
	      this.opcode('pushProgram', inverse);
	      this.opcode('emptyHash');
	      this.opcode('blockValue', block.path.original);
	    } else {
	      this.ambiguousSexpr(block, program, inverse);

	      // now that the simple mustache is resolved, we need to
	      // evaluate it by executing `blockHelperMissing`
	      this.opcode('pushProgram', program);
	      this.opcode('pushProgram', inverse);
	      this.opcode('emptyHash');
	      this.opcode('ambiguousBlockValue');
	    }

	    this.opcode('append');
	  },

	  DecoratorBlock(decorator) {
	    let program = decorator.program && this.compileProgram(decorator.program);
	    let params = this.setupFullMustacheParams(decorator, program, undefined),
	      path = decorator.path;

	    this.useDecorators = true;
	    this.opcode('registerDecorator', params.length, path.original);
	  },

	  PartialStatement: function(partial) {
	    this.usePartial = true;

	    let program = partial.program;
	    if (program) {
	      program = this.compileProgram(partial.program);
	    }

	    let params = partial.params;
	    if (params.length > 1) {
	      throw new Exception(
	        'Unsupported number of partial arguments: ' + params.length,
	        partial
	      );
	    } else if (!params.length) {
	      if (this.options.explicitPartialContext) {
	        this.opcode('pushLiteral', 'undefined');
	      } else {
	        params.push({ type: 'PathExpression', parts: [], depth: 0 });
	      }
	    }

	    let partialName = partial.name.original,
	      isDynamic = partial.name.type === 'SubExpression';
	    if (isDynamic) {
	      this.accept(partial.name);
	    }

	    this.setupFullMustacheParams(partial, program, undefined, true);

	    let indent = partial.indent || '';
	    if (this.options.preventIndent && indent) {
	      this.opcode('appendContent', indent);
	      indent = '';
	    }

	    this.opcode('invokePartial', isDynamic, partialName, indent);
	    this.opcode('append');
	  },
	  PartialBlockStatement: function(partialBlock) {
	    this.PartialStatement(partialBlock);
	  },

	  MustacheStatement: function(mustache) {
	    this.SubExpression(mustache);

	    if (mustache.escaped && !this.options.noEscape) {
	      this.opcode('appendEscaped');
	    } else {
	      this.opcode('append');
	    }
	  },
	  Decorator(decorator) {
	    this.DecoratorBlock(decorator);
	  },

	  ContentStatement: function(content) {
	    if (content.value) {
	      this.opcode('appendContent', content.value);
	    }
	  },

	  CommentStatement: function() {},

	  SubExpression: function(sexpr) {
	    transformLiteralToPath(sexpr);
	    let type = this.classifySexpr(sexpr);

	    if (type === 'simple') {
	      this.simpleSexpr(sexpr);
	    } else if (type === 'helper') {
	      this.helperSexpr(sexpr);
	    } else {
	      this.ambiguousSexpr(sexpr);
	    }
	  },
	  ambiguousSexpr: function(sexpr, program, inverse) {
	    let path = sexpr.path,
	      name = path.parts[0],
	      isBlock = program != null || inverse != null;

	    this.opcode('getContext', path.depth);

	    this.opcode('pushProgram', program);
	    this.opcode('pushProgram', inverse);

	    path.strict = true;
	    this.accept(path);

	    this.opcode('invokeAmbiguous', name, isBlock);
	  },

	  simpleSexpr: function(sexpr) {
	    let path = sexpr.path;
	    path.strict = true;
	    this.accept(path);
	    this.opcode('resolvePossibleLambda');
	  },

	  helperSexpr: function(sexpr, program, inverse) {
	    let params = this.setupFullMustacheParams(sexpr, program, inverse),
	      path = sexpr.path,
	      name = path.parts[0];

	    if (this.options.knownHelpers[name]) {
	      this.opcode('invokeKnownHelper', params.length, name);
	    } else if (this.options.knownHelpersOnly) {
	      throw new Exception(
	        'You specified knownHelpersOnly, but used the unknown helper ' + name,
	        sexpr
	      );
	    } else {
	      path.strict = true;
	      path.falsy = true;

	      this.accept(path);
	      this.opcode(
	        'invokeHelper',
	        params.length,
	        path.original,
	        AST.helpers.simpleId(path)
	      );
	    }
	  },

	  PathExpression: function(path) {
	    this.addDepth(path.depth);
	    this.opcode('getContext', path.depth);

	    let name = path.parts[0],
	      scoped = AST.helpers.scopedId(path),
	      blockParamId = !path.depth && !scoped && this.blockParamIndex(name);

	    if (blockParamId) {
	      this.opcode('lookupBlockParam', blockParamId, path.parts);
	    } else if (!name) {
	      // Context reference, i.e. `{{foo .}}` or `{{foo ..}}`
	      this.opcode('pushContext');
	    } else if (path.data) {
	      this.options.data = true;
	      this.opcode('lookupData', path.depth, path.parts, path.strict);
	    } else {
	      this.opcode(
	        'lookupOnContext',
	        path.parts,
	        path.falsy,
	        path.strict,
	        scoped
	      );
	    }
	  },

	  StringLiteral: function(string) {
	    this.opcode('pushString', string.value);
	  },

	  NumberLiteral: function(number) {
	    this.opcode('pushLiteral', number.value);
	  },

	  BooleanLiteral: function(bool) {
	    this.opcode('pushLiteral', bool.value);
	  },

	  UndefinedLiteral: function() {
	    this.opcode('pushLiteral', 'undefined');
	  },

	  NullLiteral: function() {
	    this.opcode('pushLiteral', 'null');
	  },

	  Hash: function(hash) {
	    let pairs = hash.pairs,
	      i = 0,
	      l = pairs.length;

	    this.opcode('pushHash');

	    for (; i < l; i++) {
	      this.pushParam(pairs[i].value);
	    }
	    while (i--) {
	      this.opcode('assignToHash', pairs[i].key);
	    }
	    this.opcode('popHash');
	  },

	  // HELPERS
	  opcode: function(name) {
	    this.opcodes.push({
	      opcode: name,
	      args: slice.call(arguments, 1),
	      loc: this.sourceNode[0].loc
	    });
	  },

	  addDepth: function(depth) {
	    if (!depth) {
	      return;
	    }

	    this.useDepths = true;
	  },

	  classifySexpr: function(sexpr) {
	    let isSimple = AST.helpers.simpleId(sexpr.path);

	    let isBlockParam = isSimple && !!this.blockParamIndex(sexpr.path.parts[0]);

	    // a mustache is an eligible helper if:
	    // * its id is simple (a single part, not `this` or `..`)
	    let isHelper = !isBlockParam && AST.helpers.helperExpression(sexpr);

	    // if a mustache is an eligible helper but not a definite
	    // helper, it is ambiguous, and will be resolved in a later
	    // pass or at runtime.
	    let isEligible = !isBlockParam && (isHelper || isSimple);

	    // if ambiguous, we can possibly resolve the ambiguity now
	    // An eligible helper is one that does not have a complex path, i.e. `this.foo`, `../foo` etc.
	    if (isEligible && !isHelper) {
	      let name = sexpr.path.parts[0],
	        options = this.options;
	      if (options.knownHelpers[name]) {
	        isHelper = true;
	      } else if (options.knownHelpersOnly) {
	        isEligible = false;
	      }
	    }

	    if (isHelper) {
	      return 'helper';
	    } else if (isEligible) {
	      return 'ambiguous';
	    } else {
	      return 'simple';
	    }
	  },

	  pushParams: function(params) {
	    for (let i = 0, l = params.length; i < l; i++) {
	      this.pushParam(params[i]);
	    }
	  },

	  pushParam: function(val) {
	    let value = val.value != null ? val.value : val.original || '';

	    if (this.stringParams) {
	      if (value.replace) {
	        value = value.replace(/^(\.?\.\/)*/g, '').replace(/\//g, '.');
	      }

	      if (val.depth) {
	        this.addDepth(val.depth);
	      }
	      this.opcode('getContext', val.depth || 0);
	      this.opcode('pushStringParam', value, val.type);

	      if (val.type === 'SubExpression') {
	        // SubExpressions get evaluated and passed in
	        // in string params mode.
	        this.accept(val);
	      }
	    } else {
	      if (this.trackIds) {
	        let blockParamIndex;
	        if (val.parts && !AST.helpers.scopedId(val) && !val.depth) {
	          blockParamIndex = this.blockParamIndex(val.parts[0]);
	        }
	        if (blockParamIndex) {
	          let blockParamChild = val.parts.slice(1).join('.');
	          this.opcode('pushId', 'BlockParam', blockParamIndex, blockParamChild);
	        } else {
	          value = val.original || value;
	          if (value.replace) {
	            value = value
	              .replace(/^this(?:\.|$)/, '')
	              .replace(/^\.\//, '')
	              .replace(/^\.$/, '');
	          }

	          this.opcode('pushId', val.type, value);
	        }
	      }
	      this.accept(val);
	    }
	  },

	  setupFullMustacheParams: function(sexpr, program, inverse, omitEmpty) {
	    let params = sexpr.params;
	    this.pushParams(params);

	    this.opcode('pushProgram', program);
	    this.opcode('pushProgram', inverse);

	    if (sexpr.hash) {
	      this.accept(sexpr.hash);
	    } else {
	      this.opcode('emptyHash', omitEmpty);
	    }

	    return params;
	  },

	  blockParamIndex: function(name) {
	    for (
	      let depth = 0, len = this.options.blockParams.length;
	      depth < len;
	      depth++
	    ) {
	      let blockParams$$1 = this.options.blockParams[depth],
	        param = blockParams$$1 && indexOf(blockParams$$1, name);
	      if (blockParams$$1 && param >= 0) {
	        return [depth, param];
	      }
	    }
	  }
	};

	function precompile(input, options, env) {
	  if (
	    input == null ||
	    (typeof input !== 'string' && input.type !== 'Program')
	  ) {
	    throw new Exception(
	      'You must pass a string or Handlebars AST to Handlebars.precompile. You passed ' +
	        input
	    );
	  }

	  options = options || {};
	  if (!('data' in options)) {
	    options.data = true;
	  }
	  if (options.compat) {
	    options.useDepths = true;
	  }

	  let ast = env.parse(input, options),
	    environment = new env.Compiler().compile(ast, options);
	  return new env.JavaScriptCompiler().compile(environment, options);
	}

	function compile(input, options = {}, env) {
	  if (
	    input == null ||
	    (typeof input !== 'string' && input.type !== 'Program')
	  ) {
	    throw new Exception(
	      'You must pass a string or Handlebars AST to Handlebars.compile. You passed ' +
	        input
	    );
	  }

	  options = extend$1({}, options);
	  if (!('data' in options)) {
	    options.data = true;
	  }
	  if (options.compat) {
	    options.useDepths = true;
	  }

	  let compiled;

	  function compileInput() {
	    let ast = env.parse(input, options),
	      environment = new env.Compiler().compile(ast, options),
	      templateSpec = new env.JavaScriptCompiler().compile(
	        environment,
	        options,
	        undefined,
	        true
	      );
	    return env.template(templateSpec);
	  }

	  // Template is only compiled on first use and cached after that point.
	  function ret(context, execOptions) {
	    if (!compiled) {
	      compiled = compileInput();
	    }
	    return compiled.call(this, context, execOptions);
	  }
	  ret._setup = function(setupOptions) {
	    if (!compiled) {
	      compiled = compileInput();
	    }
	    return compiled._setup(setupOptions);
	  };
	  ret._child = function(i, data, blockParams$$1, depths) {
	    if (!compiled) {
	      compiled = compileInput();
	    }
	    return compiled._child(i, data, blockParams$$1, depths);
	  };
	  return ret;
	}

	function argEquals(a, b) {
	  if (a === b) {
	    return true;
	  }

	  if (isArray$1(a) && isArray$1(b) && a.length === b.length) {
	    for (let i = 0; i < a.length; i++) {
	      if (!argEquals(a[i], b[i])) {
	        return false;
	      }
	    }
	    return true;
	  }
	}

	function transformLiteralToPath(sexpr) {
	  if (!sexpr.path.parts) {
	    let literal = sexpr.path;
	    // Casting to string here to make false and 0 literal values play nicely with the rest
	    // of the system.
	    sexpr.path = {
	      type: 'PathExpression',
	      data: false,
	      depth: 0,
	      parts: [literal.original + ''],
	      original: literal.original + '',
	      loc: literal.loc
	    };
	  }
	}

	/* global define */

	let SourceNode;

	try {
	  /* istanbul ignore next */
	  if (typeof define !== 'function' || !define.amd) {
	    // We don't support this in AMD environments. For these environments, we asusme that
	    // they are running on the browser and thus have no need for the source-map library.
	    let SourceMap = require('source-map');
	    SourceNode = SourceMap.SourceNode;
	  }
	} catch (err) {
	  /* NOP */
	}

	/* istanbul ignore if: tested but not covered in istanbul due to dist build  */
	if (!SourceNode) {
	  SourceNode = function(line, column, srcFile, chunks) {
	    this.src = '';
	    if (chunks) {
	      this.add(chunks);
	    }
	  };
	  /* istanbul ignore next */
	  SourceNode.prototype = {
	    add: function(chunks) {
	      if (isArray$1(chunks)) {
	        chunks = chunks.join('');
	      }
	      this.src += chunks;
	    },
	    prepend: function(chunks) {
	      if (isArray$1(chunks)) {
	        chunks = chunks.join('');
	      }
	      this.src = chunks + this.src;
	    },
	    toStringWithSourceMap: function() {
	      return { code: this.toString() };
	    },
	    toString: function() {
	      return this.src;
	    }
	  };
	}

	function castChunk(chunk, codeGen, loc) {
	  if (isArray$1(chunk)) {
	    let ret = [];

	    for (let i = 0, len = chunk.length; i < len; i++) {
	      ret.push(codeGen.wrap(chunk[i], loc));
	    }
	    return ret;
	  } else if (typeof chunk === 'boolean' || typeof chunk === 'number') {
	    // Handle primitives that the SourceNode will throw up on
	    return chunk + '';
	  }
	  return chunk;
	}

	function CodeGen(srcFile) {
	  this.srcFile = srcFile;
	  this.source = [];
	}

	CodeGen.prototype = {
	  isEmpty() {
	    return !this.source.length;
	  },
	  prepend: function(source, loc) {
	    this.source.unshift(this.wrap(source, loc));
	  },
	  push: function(source, loc) {
	    this.source.push(this.wrap(source, loc));
	  },

	  merge: function() {
	    let source = this.empty();
	    this.each(function(line) {
	      source.add(['  ', line, '\n']);
	    });
	    return source;
	  },

	  each: function(iter) {
	    for (let i = 0, len = this.source.length; i < len; i++) {
	      iter(this.source[i]);
	    }
	  },

	  empty: function() {
	    let loc = this.currentLocation || { start: {} };
	    return new SourceNode(loc.start.line, loc.start.column, this.srcFile);
	  },
	  wrap: function(chunk, loc = this.currentLocation || { start: {} }) {
	    if (chunk instanceof SourceNode) {
	      return chunk;
	    }

	    chunk = castChunk(chunk, this, loc);

	    return new SourceNode(
	      loc.start.line,
	      loc.start.column,
	      this.srcFile,
	      chunk
	    );
	  },

	  functionCall: function(fn, type, params) {
	    params = this.generateList(params);
	    return this.wrap([fn, type ? '.' + type + '(' : '(', params, ')']);
	  },

	  quotedString: function(str) {
	    return (
	      '"' +
	      (str + '')
	        .replace(/\\/g, '\\\\')
	        .replace(/"/g, '\\"')
	        .replace(/\n/g, '\\n')
	        .replace(/\r/g, '\\r')
	        .replace(/\u2028/g, '\\u2028') // Per Ecma-262 7.3 + 7.8.4
	        .replace(/\u2029/g, '\\u2029') +
	      '"'
	    );
	  },

	  objectLiteral: function(obj) {
	    let pairs = [];

	    Object.keys(obj).forEach(key => {
	      let value = castChunk(obj[key], this);
	      if (value !== 'undefined') {
	        pairs.push([this.quotedString(key), ':', value]);
	      }
	    });

	    let ret = this.generateList(pairs);
	    ret.prepend('{');
	    ret.add('}');
	    return ret;
	  },

	  generateList: function(entries) {
	    let ret = this.empty();

	    for (let i = 0, len = entries.length; i < len; i++) {
	      if (i) {
	        ret.add(',');
	      }

	      ret.add(castChunk(entries[i], this));
	    }

	    return ret;
	  },

	  generateArray: function(entries) {
	    let ret = this.generateList(entries);
	    ret.prepend('[');
	    ret.add(']');

	    return ret;
	  }
	};

	function Literal(value) {
	  this.value = value;
	}

	function JavaScriptCompiler() {}

	JavaScriptCompiler.prototype = {
	  // PUBLIC API: You can override these methods in a subclass to provide
	  // alternative compiled forms for name lookup and buffering semantics
	  nameLookup: function(parent, name /*,  type */) {
	    return this.internalNameLookup(parent, name);
	  },
	  depthedLookup: function(name) {
	    return [
	      this.aliasable('container.lookup'),
	      '(depths, ',
	      JSON.stringify(name),
	      ')'
	    ];
	  },

	  compilerInfo: function() {
	    const revision = COMPILER_REVISION,
	      versions = REVISION_CHANGES[revision];
	    return [revision, versions];
	  },

	  appendToBuffer: function(source, location, explicit) {
	    // Force a source as this simplifies the merge logic.
	    if (!isArray$1(source)) {
	      source = [source];
	    }
	    source = this.source.wrap(source, location);

	    if (this.environment.isSimple) {
	      return ['return ', source, ';'];
	    } else if (explicit) {
	      // This is a case where the buffer operation occurs as a child of another
	      // construct, generally braces. We have to explicitly output these buffer
	      // operations to ensure that the emitted code goes in the correct location.
	      return ['buffer += ', source, ';'];
	    } else {
	      source.appendToBuffer = true;
	      return source;
	    }
	  },

	  initializeBuffer: function() {
	    return this.quotedString('');
	  },
	  // END PUBLIC API
	  internalNameLookup: function(parent, name) {
	    this.lookupPropertyFunctionIsUsed = true;
	    return ['lookupProperty(', parent, ',', JSON.stringify(name), ')'];
	  },

	  lookupPropertyFunctionIsUsed: false,

	  compile: function(environment, options, context, asObject) {
	    this.environment = environment;
	    this.options = options;
	    this.stringParams = this.options.stringParams;
	    this.trackIds = this.options.trackIds;
	    this.precompile = !asObject;

	    this.name = this.environment.name;
	    this.isChild = !!context;
	    this.context = context || {
	      decorators: [],
	      programs: [],
	      environments: []
	    };

	    this.preamble();

	    this.stackSlot = 0;
	    this.stackVars = [];
	    this.aliases = {};
	    this.registers = { list: [] };
	    this.hashes = [];
	    this.compileStack = [];
	    this.inlineStack = [];
	    this.blockParams = [];

	    this.compileChildren(environment, options);

	    this.useDepths =
	      this.useDepths ||
	      environment.useDepths ||
	      environment.useDecorators ||
	      this.options.compat;
	    this.useBlockParams = this.useBlockParams || environment.useBlockParams;

	    let opcodes = environment.opcodes,
	      opcode,
	      firstLoc,
	      i,
	      l;

	    for (i = 0, l = opcodes.length; i < l; i++) {
	      opcode = opcodes[i];

	      this.source.currentLocation = opcode.loc;
	      firstLoc = firstLoc || opcode.loc;
	      this[opcode.opcode].apply(this, opcode.args);
	    }

	    // Flush any trailing content that might be pending.
	    this.source.currentLocation = firstLoc;
	    this.pushSource('');

	    /* istanbul ignore next */
	    if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
	      throw new Exception('Compile completed with content left on stack');
	    }

	    if (!this.decorators.isEmpty()) {
	      this.useDecorators = true;

	      this.decorators.prepend([
	        'var decorators = container.decorators, ',
	        this.lookupPropertyFunctionVarDeclaration(),
	        ';\n'
	      ]);
	      this.decorators.push('return fn;');

	      if (asObject) {
	        this.decorators = Function.apply(this, [
	          'fn',
	          'props',
	          'container',
	          'depth0',
	          'data',
	          'blockParams',
	          'depths',
	          this.decorators.merge()
	        ]);
	      } else {
	        this.decorators.prepend(
	          'function(fn, props, container, depth0, data, blockParams, depths) {\n'
	        );
	        this.decorators.push('}\n');
	        this.decorators = this.decorators.merge();
	      }
	    } else {
	      this.decorators = undefined;
	    }

	    let fn = this.createFunctionContext(asObject);
	    if (!this.isChild) {
	      let ret = {
	        compiler: this.compilerInfo(),
	        main: fn
	      };

	      if (this.decorators) {
	        ret.main_d = this.decorators; // eslint-disable-line camelcase
	        ret.useDecorators = true;
	      }

	      let { programs, decorators } = this.context;
	      for (i = 0, l = programs.length; i < l; i++) {
	        if (programs[i]) {
	          ret[i] = programs[i];
	          if (decorators[i]) {
	            ret[i + '_d'] = decorators[i];
	            ret.useDecorators = true;
	          }
	        }
	      }

	      if (this.environment.usePartial) {
	        ret.usePartial = true;
	      }
	      if (this.options.data) {
	        ret.useData = true;
	      }
	      if (this.useDepths) {
	        ret.useDepths = true;
	      }
	      if (this.useBlockParams) {
	        ret.useBlockParams = true;
	      }
	      if (this.options.compat) {
	        ret.compat = true;
	      }

	      if (!asObject) {
	        ret.compiler = JSON.stringify(ret.compiler);

	        this.source.currentLocation = { start: { line: 1, column: 0 } };
	        ret = this.objectLiteral(ret);

	        if (options.srcName) {
	          ret = ret.toStringWithSourceMap({ file: options.destName });
	          ret.map = ret.map && ret.map.toString();
	        } else {
	          ret = ret.toString();
	        }
	      } else {
	        ret.compilerOptions = this.options;
	      }

	      return ret;
	    } else {
	      return fn;
	    }
	  },

	  preamble: function() {
	    // track the last context pushed into place to allow skipping the
	    // getContext opcode when it would be a noop
	    this.lastContext = 0;
	    this.source = new CodeGen(this.options.srcName);
	    this.decorators = new CodeGen(this.options.srcName);
	  },

	  createFunctionContext: function(asObject) {
	    let varDeclarations = '';

	    let locals = this.stackVars.concat(this.registers.list);
	    if (locals.length > 0) {
	      varDeclarations += ', ' + locals.join(', ');
	    }

	    // Generate minimizer alias mappings
	    //
	    // When using true SourceNodes, this will update all references to the given alias
	    // as the source nodes are reused in situ. For the non-source node compilation mode,
	    // aliases will not be used, but this case is already being run on the client and
	    // we aren't concern about minimizing the template size.
	    let aliasCount = 0;
	    Object.keys(this.aliases).forEach(alias => {
	      let node = this.aliases[alias];
	      if (node.children && node.referenceCount > 1) {
	        varDeclarations += ', alias' + ++aliasCount + '=' + alias;
	        node.children[0] = 'alias' + aliasCount;
	      }
	    });

	    if (this.lookupPropertyFunctionIsUsed) {
	      varDeclarations += ', ' + this.lookupPropertyFunctionVarDeclaration();
	    }

	    let params = ['container', 'depth0', 'helpers', 'partials', 'data'];

	    if (this.useBlockParams || this.useDepths) {
	      params.push('blockParams');
	    }
	    if (this.useDepths) {
	      params.push('depths');
	    }

	    // Perform a second pass over the output to merge content when possible
	    let source = this.mergeSource(varDeclarations);

	    if (asObject) {
	      params.push(source);

	      return Function.apply(this, params);
	    } else {
	      return this.source.wrap([
	        'function(',
	        params.join(','),
	        ') {\n  ',
	        source,
	        '}'
	      ]);
	    }
	  },
	  mergeSource: function(varDeclarations) {
	    let isSimple = this.environment.isSimple,
	      appendOnly = !this.forceBuffer,
	      appendFirst,
	      sourceSeen,
	      bufferStart,
	      bufferEnd;
	    this.source.each(line => {
	      if (line.appendToBuffer) {
	        if (bufferStart) {
	          line.prepend('  + ');
	        } else {
	          bufferStart = line;
	        }
	        bufferEnd = line;
	      } else {
	        if (bufferStart) {
	          if (!sourceSeen) {
	            appendFirst = true;
	          } else {
	            bufferStart.prepend('buffer += ');
	          }
	          bufferEnd.add(';');
	          bufferStart = bufferEnd = undefined;
	        }

	        sourceSeen = true;
	        if (!isSimple) {
	          appendOnly = false;
	        }
	      }
	    });

	    if (appendOnly) {
	      if (bufferStart) {
	        bufferStart.prepend('return ');
	        bufferEnd.add(';');
	      } else if (!sourceSeen) {
	        this.source.push('return "";');
	      }
	    } else {
	      varDeclarations +=
	        ', buffer = ' + (appendFirst ? '' : this.initializeBuffer());

	      if (bufferStart) {
	        bufferStart.prepend('return buffer + ');
	        bufferEnd.add(';');
	      } else {
	        this.source.push('return buffer;');
	      }
	    }

	    if (varDeclarations) {
	      this.source.prepend(
	        'var ' + varDeclarations.substring(2) + (appendFirst ? '' : ';\n')
	      );
	    }

	    return this.source.merge();
	  },

	  lookupPropertyFunctionVarDeclaration: function() {
	    return `
      lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    }
    `.trim();
	  },

	  // [blockValue]
	  //
	  // On stack, before: hash, inverse, program, value
	  // On stack, after: return value of blockHelperMissing
	  //
	  // The purpose of this opcode is to take a block of the form
	  // `{{#this.foo}}...{{/this.foo}}`, resolve the value of `foo`, and
	  // replace it on the stack with the result of properly
	  // invoking blockHelperMissing.
	  blockValue: function(name) {
	    let blockHelperMissing = this.aliasable(
	        'container.hooks.blockHelperMissing'
	      ),
	      params = [this.contextName(0)];
	    this.setupHelperArgs(name, 0, params);

	    let blockName = this.popStack();
	    params.splice(1, 0, blockName);

	    this.push(this.source.functionCall(blockHelperMissing, 'call', params));
	  },

	  // [ambiguousBlockValue]
	  //
	  // On stack, before: hash, inverse, program, value
	  // Compiler value, before: lastHelper=value of last found helper, if any
	  // On stack, after, if no lastHelper: same as [blockValue]
	  // On stack, after, if lastHelper: value
	  ambiguousBlockValue: function() {
	    // We're being a bit cheeky and reusing the options value from the prior exec
	    let blockHelperMissing = this.aliasable(
	        'container.hooks.blockHelperMissing'
	      ),
	      params = [this.contextName(0)];
	    this.setupHelperArgs('', 0, params, true);

	    this.flushInline();

	    let current = this.topStack();
	    params.splice(1, 0, current);

	    this.pushSource([
	      'if (!',
	      this.lastHelper,
	      ') { ',
	      current,
	      ' = ',
	      this.source.functionCall(blockHelperMissing, 'call', params),
	      '}'
	    ]);
	  },

	  // [appendContent]
	  //
	  // On stack, before: ...
	  // On stack, after: ...
	  //
	  // Appends the string value of `content` to the current buffer
	  appendContent: function(content) {
	    if (this.pendingContent) {
	      content = this.pendingContent + content;
	    } else {
	      this.pendingLocation = this.source.currentLocation;
	    }

	    this.pendingContent = content;
	  },

	  // [append]
	  //
	  // On stack, before: value, ...
	  // On stack, after: ...
	  //
	  // Coerces `value` to a String and appends it to the current buffer.
	  //
	  // If `value` is truthy, or 0, it is coerced into a string and appended
	  // Otherwise, the empty string is appended
	  append: function() {
	    if (this.isInline()) {
	      this.replaceStack(current => [' != null ? ', current, ' : ""']);

	      this.pushSource(this.appendToBuffer(this.popStack()));
	    } else {
	      let local = this.popStack();
	      this.pushSource([
	        'if (',
	        local,
	        ' != null) { ',
	        this.appendToBuffer(local, undefined, true),
	        ' }'
	      ]);
	      if (this.environment.isSimple) {
	        this.pushSource([
	          'else { ',
	          this.appendToBuffer("''", undefined, true),
	          ' }'
	        ]);
	      }
	    }
	  },

	  // [appendEscaped]
	  //
	  // On stack, before: value, ...
	  // On stack, after: ...
	  //
	  // Escape `value` and append it to the buffer
	  appendEscaped: function() {
	    this.pushSource(
	      this.appendToBuffer([
	        this.aliasable('container.escapeExpression'),
	        '(',
	        this.popStack(),
	        ')'
	      ])
	    );
	  },

	  // [getContext]
	  //
	  // On stack, before: ...
	  // On stack, after: ...
	  // Compiler value, after: lastContext=depth
	  //
	  // Set the value of the `lastContext` compiler value to the depth
	  getContext: function(depth) {
	    this.lastContext = depth;
	  },

	  // [pushContext]
	  //
	  // On stack, before: ...
	  // On stack, after: currentContext, ...
	  //
	  // Pushes the value of the current context onto the stack.
	  pushContext: function() {
	    this.pushStackLiteral(this.contextName(this.lastContext));
	  },

	  // [lookupOnContext]
	  //
	  // On stack, before: ...
	  // On stack, after: currentContext[name], ...
	  //
	  // Looks up the value of `name` on the current context and pushes
	  // it onto the stack.
	  lookupOnContext: function(parts, falsy, strict, scoped) {
	    let i = 0;

	    if (!scoped && this.options.compat && !this.lastContext) {
	      // The depthed query is expected to handle the undefined logic for the root level that
	      // is implemented below, so we evaluate that directly in compat mode
	      this.push(this.depthedLookup(parts[i++]));
	    } else {
	      this.pushContext();
	    }

	    this.resolvePath('context', parts, i, falsy, strict);
	  },

	  // [lookupBlockParam]
	  //
	  // On stack, before: ...
	  // On stack, after: blockParam[name], ...
	  //
	  // Looks up the value of `parts` on the given block param and pushes
	  // it onto the stack.
	  lookupBlockParam: function(blockParamId, parts) {
	    this.useBlockParams = true;

	    this.push(['blockParams[', blockParamId[0], '][', blockParamId[1], ']']);
	    this.resolvePath('context', parts, 1);
	  },

	  // [lookupData]
	  //
	  // On stack, before: ...
	  // On stack, after: data, ...
	  //
	  // Push the data lookup operator
	  lookupData: function(depth, parts, strict) {
	    if (!depth) {
	      this.pushStackLiteral('data');
	    } else {
	      this.pushStackLiteral('container.data(data, ' + depth + ')');
	    }

	    this.resolvePath('data', parts, 0, true, strict);
	  },

	  resolvePath: function(type, parts, i, falsy, strict) {
	    if (this.options.strict || this.options.assumeObjects) {
	      this.push(strictLookup(this.options.strict && strict, this, parts, type));
	      return;
	    }

	    let len = parts.length;
	    for (; i < len; i++) {
	      /* eslint-disable no-loop-func */
	      this.replaceStack(current => {
	        let lookup = this.nameLookup(current, parts[i], type);
	        // We want to ensure that zero and false are handled properly if the context (falsy flag)
	        // needs to have the special handling for these values.
	        if (!falsy) {
	          return [' != null ? ', lookup, ' : ', current];
	        } else {
	          // Otherwise we can use generic falsy handling
	          return [' && ', lookup];
	        }
	      });
	      /* eslint-enable no-loop-func */
	    }
	  },

	  // [resolvePossibleLambda]
	  //
	  // On stack, before: value, ...
	  // On stack, after: resolved value, ...
	  //
	  // If the `value` is a lambda, replace it on the stack by
	  // the return value of the lambda
	  resolvePossibleLambda: function() {
	    this.push([
	      this.aliasable('container.lambda'),
	      '(',
	      this.popStack(),
	      ', ',
	      this.contextName(0),
	      ')'
	    ]);
	  },

	  // [pushStringParam]
	  //
	  // On stack, before: ...
	  // On stack, after: string, currentContext, ...
	  //
	  // This opcode is designed for use in string mode, which
	  // provides the string value of a parameter along with its
	  // depth rather than resolving it immediately.
	  pushStringParam: function(string, type) {
	    this.pushContext();
	    this.pushString(type);

	    // If it's a subexpression, the string result
	    // will be pushed after this opcode.
	    if (type !== 'SubExpression') {
	      if (typeof string === 'string') {
	        this.pushString(string);
	      } else {
	        this.pushStackLiteral(string);
	      }
	    }
	  },

	  emptyHash: function(omitEmpty) {
	    if (this.trackIds) {
	      this.push('{}'); // hashIds
	    }
	    if (this.stringParams) {
	      this.push('{}'); // hashContexts
	      this.push('{}'); // hashTypes
	    }
	    this.pushStackLiteral(omitEmpty ? 'undefined' : '{}');
	  },
	  pushHash: function() {
	    if (this.hash) {
	      this.hashes.push(this.hash);
	    }
	    this.hash = { values: {}, types: [], contexts: [], ids: [] };
	  },
	  popHash: function() {
	    let hash = this.hash;
	    this.hash = this.hashes.pop();

	    if (this.trackIds) {
	      this.push(this.objectLiteral(hash.ids));
	    }
	    if (this.stringParams) {
	      this.push(this.objectLiteral(hash.contexts));
	      this.push(this.objectLiteral(hash.types));
	    }

	    this.push(this.objectLiteral(hash.values));
	  },

	  // [pushString]
	  //
	  // On stack, before: ...
	  // On stack, after: quotedString(string), ...
	  //
	  // Push a quoted version of `string` onto the stack
	  pushString: function(string) {
	    this.pushStackLiteral(this.quotedString(string));
	  },

	  // [pushLiteral]
	  //
	  // On stack, before: ...
	  // On stack, after: value, ...
	  //
	  // Pushes a value onto the stack. This operation prevents
	  // the compiler from creating a temporary variable to hold
	  // it.
	  pushLiteral: function(value) {
	    this.pushStackLiteral(value);
	  },

	  // [pushProgram]
	  //
	  // On stack, before: ...
	  // On stack, after: program(guid), ...
	  //
	  // Push a program expression onto the stack. This takes
	  // a compile-time guid and converts it into a runtime-accessible
	  // expression.
	  pushProgram: function(guid) {
	    if (guid != null) {
	      this.pushStackLiteral(this.programExpression(guid));
	    } else {
	      this.pushStackLiteral(null);
	    }
	  },

	  // [registerDecorator]
	  //
	  // On stack, before: hash, program, params..., ...
	  // On stack, after: ...
	  //
	  // Pops off the decorator's parameters, invokes the decorator,
	  // and inserts the decorator into the decorators list.
	  registerDecorator(paramSize, name) {
	    let foundDecorator = this.nameLookup('decorators', name, 'decorator'),
	      options = this.setupHelperArgs(name, paramSize);

	    this.decorators.push([
	      'fn = ',
	      this.decorators.functionCall(foundDecorator, '', [
	        'fn',
	        'props',
	        'container',
	        options
	      ]),
	      ' || fn;'
	    ]);
	  },

	  // [invokeHelper]
	  //
	  // On stack, before: hash, inverse, program, params..., ...
	  // On stack, after: result of helper invocation
	  //
	  // Pops off the helper's parameters, invokes the helper,
	  // and pushes the helper's return value onto the stack.
	  //
	  // If the helper is not found, `helperMissing` is called.
	  invokeHelper: function(paramSize, name, isSimple) {
	    let nonHelper = this.popStack(),
	      helper = this.setupHelper(paramSize, name);

	    let possibleFunctionCalls = [];

	    if (isSimple) {
	      // direct call to helper
	      possibleFunctionCalls.push(helper.name);
	    }
	    // call a function from the input object
	    possibleFunctionCalls.push(nonHelper);
	    if (!this.options.strict) {
	      possibleFunctionCalls.push(
	        this.aliasable('container.hooks.helperMissing')
	      );
	    }

	    let functionLookupCode = [
	      '(',
	      this.itemsSeparatedBy(possibleFunctionCalls, '||'),
	      ')'
	    ];
	    let functionCall = this.source.functionCall(
	      functionLookupCode,
	      'call',
	      helper.callParams
	    );
	    this.push(functionCall);
	  },

	  itemsSeparatedBy: function(items, separator) {
	    let result = [];
	    result.push(items[0]);
	    for (let i = 1; i < items.length; i++) {
	      result.push(separator, items[i]);
	    }
	    return result;
	  },
	  // [invokeKnownHelper]
	  //
	  // On stack, before: hash, inverse, program, params..., ...
	  // On stack, after: result of helper invocation
	  //
	  // This operation is used when the helper is known to exist,
	  // so a `helperMissing` fallback is not required.
	  invokeKnownHelper: function(paramSize, name) {
	    let helper = this.setupHelper(paramSize, name);
	    this.push(this.source.functionCall(helper.name, 'call', helper.callParams));
	  },

	  // [invokeAmbiguous]
	  //
	  // On stack, before: hash, inverse, program, params..., ...
	  // On stack, after: result of disambiguation
	  //
	  // This operation is used when an expression like `{{foo}}`
	  // is provided, but we don't know at compile-time whether it
	  // is a helper or a path.
	  //
	  // This operation emits more code than the other options,
	  // and can be avoided by passing the `knownHelpers` and
	  // `knownHelpersOnly` flags at compile-time.
	  invokeAmbiguous: function(name, helperCall) {
	    this.useRegister('helper');

	    let nonHelper = this.popStack();

	    this.emptyHash();
	    let helper = this.setupHelper(0, name, helperCall);

	    let helperName = (this.lastHelper = this.nameLookup(
	      'helpers',
	      name,
	      'helper'
	    ));

	    let lookup = ['(', '(helper = ', helperName, ' || ', nonHelper, ')'];
	    if (!this.options.strict) {
	      lookup[0] = '(helper = ';
	      lookup.push(
	        ' != null ? helper : ',
	        this.aliasable('container.hooks.helperMissing')
	      );
	    }

	    this.push([
	      '(',
	      lookup,
	      helper.paramsInit ? ['),(', helper.paramsInit] : [],
	      '),',
	      '(typeof helper === ',
	      this.aliasable('"function"'),
	      ' ? ',
	      this.source.functionCall('helper', 'call', helper.callParams),
	      ' : helper))'
	    ]);
	  },

	  // [invokePartial]
	  //
	  // On stack, before: context, ...
	  // On stack after: result of partial invocation
	  //
	  // This operation pops off a context, invokes a partial with that context,
	  // and pushes the result of the invocation back.
	  invokePartial: function(isDynamic, name, indent) {
	    let params = [],
	      options = this.setupParams(name, 1, params);

	    if (isDynamic) {
	      name = this.popStack();
	      delete options.name;
	    }

	    if (indent) {
	      options.indent = JSON.stringify(indent);
	    }
	    options.helpers = 'helpers';
	    options.partials = 'partials';
	    options.decorators = 'container.decorators';

	    if (!isDynamic) {
	      params.unshift(this.nameLookup('partials', name, 'partial'));
	    } else {
	      params.unshift(name);
	    }

	    if (this.options.compat) {
	      options.depths = 'depths';
	    }
	    options = this.objectLiteral(options);
	    params.push(options);

	    this.push(this.source.functionCall('container.invokePartial', '', params));
	  },

	  // [assignToHash]
	  //
	  // On stack, before: value, ..., hash, ...
	  // On stack, after: ..., hash, ...
	  //
	  // Pops a value off the stack and assigns it to the current hash
	  assignToHash: function(key) {
	    let value = this.popStack(),
	      context,
	      type,
	      id;

	    if (this.trackIds) {
	      id = this.popStack();
	    }
	    if (this.stringParams) {
	      type = this.popStack();
	      context = this.popStack();
	    }

	    let hash = this.hash;
	    if (context) {
	      hash.contexts[key] = context;
	    }
	    if (type) {
	      hash.types[key] = type;
	    }
	    if (id) {
	      hash.ids[key] = id;
	    }
	    hash.values[key] = value;
	  },

	  pushId: function(type, name, child) {
	    if (type === 'BlockParam') {
	      this.pushStackLiteral(
	        'blockParams[' +
	          name[0] +
	          '].path[' +
	          name[1] +
	          ']' +
	          (child ? ' + ' + JSON.stringify('.' + child) : '')
	      );
	    } else if (type === 'PathExpression') {
	      this.pushString(name);
	    } else if (type === 'SubExpression') {
	      this.pushStackLiteral('true');
	    } else {
	      this.pushStackLiteral('null');
	    }
	  },

	  // HELPERS

	  compiler: JavaScriptCompiler,

	  compileChildren: function(environment, options) {
	    let children = environment.children,
	      child,
	      compiler;

	    for (let i = 0, l = children.length; i < l; i++) {
	      child = children[i];
	      compiler = new this.compiler(); // eslint-disable-line new-cap

	      let existing = this.matchExistingProgram(child);

	      if (existing == null) {
	        this.context.programs.push(''); // Placeholder to prevent name conflicts for nested children
	        let index = this.context.programs.length;
	        child.index = index;
	        child.name = 'program' + index;
	        this.context.programs[index] = compiler.compile(
	          child,
	          options,
	          this.context,
	          !this.precompile
	        );
	        this.context.decorators[index] = compiler.decorators;
	        this.context.environments[index] = child;

	        this.useDepths = this.useDepths || compiler.useDepths;
	        this.useBlockParams = this.useBlockParams || compiler.useBlockParams;
	        child.useDepths = this.useDepths;
	        child.useBlockParams = this.useBlockParams;
	      } else {
	        child.index = existing.index;
	        child.name = 'program' + existing.index;

	        this.useDepths = this.useDepths || existing.useDepths;
	        this.useBlockParams = this.useBlockParams || existing.useBlockParams;
	      }
	    }
	  },
	  matchExistingProgram: function(child) {
	    for (let i = 0, len = this.context.environments.length; i < len; i++) {
	      let environment = this.context.environments[i];
	      if (environment && environment.equals(child)) {
	        return environment;
	      }
	    }
	  },

	  programExpression: function(guid) {
	    let child = this.environment.children[guid],
	      programParams = [child.index, 'data', child.blockParams];

	    if (this.useBlockParams || this.useDepths) {
	      programParams.push('blockParams');
	    }
	    if (this.useDepths) {
	      programParams.push('depths');
	    }

	    return 'container.program(' + programParams.join(', ') + ')';
	  },

	  useRegister: function(name) {
	    if (!this.registers[name]) {
	      this.registers[name] = true;
	      this.registers.list.push(name);
	    }
	  },

	  push: function(expr) {
	    if (!(expr instanceof Literal)) {
	      expr = this.source.wrap(expr);
	    }

	    this.inlineStack.push(expr);
	    return expr;
	  },

	  pushStackLiteral: function(item) {
	    this.push(new Literal(item));
	  },

	  pushSource: function(source) {
	    if (this.pendingContent) {
	      this.source.push(
	        this.appendToBuffer(
	          this.source.quotedString(this.pendingContent),
	          this.pendingLocation
	        )
	      );
	      this.pendingContent = undefined;
	    }

	    if (source) {
	      this.source.push(source);
	    }
	  },

	  replaceStack: function(callback) {
	    let prefix = ['('],
	      stack,
	      createdStack,
	      usedLiteral;

	    /* istanbul ignore next */
	    if (!this.isInline()) {
	      throw new Exception('replaceStack on non-inline');
	    }

	    // We want to merge the inline statement into the replacement statement via ','
	    let top = this.popStack(true);

	    if (top instanceof Literal) {
	      // Literals do not need to be inlined
	      stack = [top.value];
	      prefix = ['(', stack];
	      usedLiteral = true;
	    } else {
	      // Get or create the current stack name for use by the inline
	      createdStack = true;
	      let name = this.incrStack();

	      prefix = ['((', this.push(name), ' = ', top, ')'];
	      stack = this.topStack();
	    }

	    let item = callback.call(this, stack);

	    if (!usedLiteral) {
	      this.popStack();
	    }
	    if (createdStack) {
	      this.stackSlot--;
	    }
	    this.push(prefix.concat(item, ')'));
	  },

	  incrStack: function() {
	    this.stackSlot++;
	    if (this.stackSlot > this.stackVars.length) {
	      this.stackVars.push('stack' + this.stackSlot);
	    }
	    return this.topStackName();
	  },
	  topStackName: function() {
	    return 'stack' + this.stackSlot;
	  },
	  flushInline: function() {
	    let inlineStack = this.inlineStack;
	    this.inlineStack = [];
	    for (let i = 0, len = inlineStack.length; i < len; i++) {
	      let entry = inlineStack[i];
	      /* istanbul ignore if */
	      if (entry instanceof Literal) {
	        this.compileStack.push(entry);
	      } else {
	        let stack = this.incrStack();
	        this.pushSource([stack, ' = ', entry, ';']);
	        this.compileStack.push(stack);
	      }
	    }
	  },
	  isInline: function() {
	    return this.inlineStack.length;
	  },

	  popStack: function(wrapped) {
	    let inline = this.isInline(),
	      item = (inline ? this.inlineStack : this.compileStack).pop();

	    if (!wrapped && item instanceof Literal) {
	      return item.value;
	    } else {
	      if (!inline) {
	        /* istanbul ignore next */
	        if (!this.stackSlot) {
	          throw new Exception('Invalid stack pop');
	        }
	        this.stackSlot--;
	      }
	      return item;
	    }
	  },

	  topStack: function() {
	    let stack = this.isInline() ? this.inlineStack : this.compileStack,
	      item = stack[stack.length - 1];

	    /* istanbul ignore if */
	    if (item instanceof Literal) {
	      return item.value;
	    } else {
	      return item;
	    }
	  },

	  contextName: function(context) {
	    if (this.useDepths && context) {
	      return 'depths[' + context + ']';
	    } else {
	      return 'depth' + context;
	    }
	  },

	  quotedString: function(str) {
	    return this.source.quotedString(str);
	  },

	  objectLiteral: function(obj) {
	    return this.source.objectLiteral(obj);
	  },

	  aliasable: function(name) {
	    let ret = this.aliases[name];
	    if (ret) {
	      ret.referenceCount++;
	      return ret;
	    }

	    ret = this.aliases[name] = this.source.wrap(name);
	    ret.aliasable = true;
	    ret.referenceCount = 1;

	    return ret;
	  },

	  setupHelper: function(paramSize, name, blockHelper) {
	    let params = [],
	      paramsInit = this.setupHelperArgs(name, paramSize, params, blockHelper);
	    let foundHelper = this.nameLookup('helpers', name, 'helper'),
	      callContext = this.aliasable(
	        `${this.contextName(0)} != null ? ${this.contextName(
          0
        )} : (container.nullContext || {})`
	      );

	    return {
	      params: params,
	      paramsInit: paramsInit,
	      name: foundHelper,
	      callParams: [callContext].concat(params)
	    };
	  },

	  setupParams: function(helper, paramSize, params) {
	    let options = {},
	      contexts = [],
	      types = [],
	      ids = [],
	      objectArgs = !params,
	      param;

	    if (objectArgs) {
	      params = [];
	    }

	    options.name = this.quotedString(helper);
	    options.hash = this.popStack();

	    if (this.trackIds) {
	      options.hashIds = this.popStack();
	    }
	    if (this.stringParams) {
	      options.hashTypes = this.popStack();
	      options.hashContexts = this.popStack();
	    }

	    let inverse = this.popStack(),
	      program = this.popStack();

	    // Avoid setting fn and inverse if neither are set. This allows
	    // helpers to do a check for `if (options.fn)`
	    if (program || inverse) {
	      options.fn = program || 'container.noop';
	      options.inverse = inverse || 'container.noop';
	    }

	    // The parameters go on to the stack in order (making sure that they are evaluated in order)
	    // so we need to pop them off the stack in reverse order
	    let i = paramSize;
	    while (i--) {
	      param = this.popStack();
	      params[i] = param;

	      if (this.trackIds) {
	        ids[i] = this.popStack();
	      }
	      if (this.stringParams) {
	        types[i] = this.popStack();
	        contexts[i] = this.popStack();
	      }
	    }

	    if (objectArgs) {
	      options.args = this.source.generateArray(params);
	    }

	    if (this.trackIds) {
	      options.ids = this.source.generateArray(ids);
	    }
	    if (this.stringParams) {
	      options.types = this.source.generateArray(types);
	      options.contexts = this.source.generateArray(contexts);
	    }

	    if (this.options.data) {
	      options.data = 'data';
	    }
	    if (this.useBlockParams) {
	      options.blockParams = 'blockParams';
	    }
	    return options;
	  },

	  setupHelperArgs: function(helper, paramSize, params, useRegister) {
	    let options = this.setupParams(helper, paramSize, params);
	    options.loc = JSON.stringify(this.source.currentLocation);
	    options = this.objectLiteral(options);
	    if (useRegister) {
	      this.useRegister('options');
	      params.push('options');
	      return ['options=', options];
	    } else if (params) {
	      params.push(options);
	      return '';
	    } else {
	      return options;
	    }
	  }
	};

	(function() {
	  const reservedWords = (
	    'break else new var' +
	    ' case finally return void' +
	    ' catch for switch while' +
	    ' continue function this with' +
	    ' default if throw' +
	    ' delete in try' +
	    ' do instanceof typeof' +
	    ' abstract enum int short' +
	    ' boolean export interface static' +
	    ' byte extends long super' +
	    ' char final native synchronized' +
	    ' class float package throws' +
	    ' const goto private transient' +
	    ' debugger implements protected volatile' +
	    ' double import public let yield await' +
	    ' null true false'
	  ).split(' ');

	  const compilerWords = (JavaScriptCompiler.RESERVED_WORDS = {});

	  for (let i = 0, l = reservedWords.length; i < l; i++) {
	    compilerWords[reservedWords[i]] = true;
	  }
	})();

	/**
	 * @deprecated May be removed in the next major version
	 */
	JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
	  return (
	    !JavaScriptCompiler.RESERVED_WORDS[name] &&
	    /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name)
	  );
	};

	function strictLookup(requireTerminal, compiler, parts, type) {
	  let stack = compiler.popStack(),
	    i = 0,
	    len = parts.length;
	  if (requireTerminal) {
	    len--;
	  }

	  for (; i < len; i++) {
	    stack = compiler.nameLookup(stack, parts[i], type);
	  }

	  if (requireTerminal) {
	    return [
	      compiler.aliasable('container.strict'),
	      '(',
	      stack,
	      ', ',
	      compiler.quotedString(parts[i]),
	      ', ',
	      JSON.stringify(compiler.source.currentLocation),
	      ' )'
	    ];
	  } else {
	    return stack;
	  }
	}

	let _create = inst.create;
	function create$1() {
	  let hb = _create();

	  hb.compile = function(input, options) {
	    return compile(input, options, hb);
	  };
	  hb.precompile = function(input, options) {
	    return precompile(input, options, hb);
	  };

	  hb.AST = AST;
	  hb.Compiler = Compiler;
	  hb.JavaScriptCompiler = JavaScriptCompiler;
	  hb.Parser = handlebars;
	  hb.parse = parse;
	  hb.parseWithoutProcessing = parseWithoutProcessing;

	  return hb;
	}

	let inst$1 = create$1();
	inst$1.create = create$1;

	noConflict(inst$1);

	inst$1.Visitor = Visitor;

	inst$1['default'] = inst$1;

	var barba = createCommonjsModule(function (module, exports) {
	(function webpackUniversalModuleDefinition(root, factory) {
		module.exports = factory();
	})(commonjsGlobal, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;
	/******/
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "http://localhost:8080/dist";
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports, __webpack_require__) {

		//Promise polyfill https://github.com/taylorhakes/promise-polyfill
		
		if (typeof Promise !== 'function') {
		 window.Promise = __webpack_require__(1);
		}
		
		var Barba = {
		  version: '1.0.0',
		  BaseTransition: __webpack_require__(4),
		  BaseView: __webpack_require__(6),
		  BaseCache: __webpack_require__(8),
		  Dispatcher: __webpack_require__(7),
		  HistoryManager: __webpack_require__(9),
		  Pjax: __webpack_require__(10),
		  Prefetch: __webpack_require__(13),
		  Utils: __webpack_require__(5)
		};
		
		module.exports = Barba;


	/***/ },
	/* 1 */
	/***/ function(module, exports, __webpack_require__) {

		/* WEBPACK VAR INJECTION */(function(setImmediate) {(function (root) {
		
		  // Store setTimeout reference so promise-polyfill will be unaffected by
		  // other code modifying setTimeout (like sinon.useFakeTimers())
		  var setTimeoutFunc = setTimeout;
		
		  function noop() {
		  }
		
		  // Use polyfill for setImmediate for performance gains
		  var asap = (typeof setImmediate === 'function' && setImmediate) ||
		    function (fn) {
		      setTimeoutFunc(fn, 0);
		    };
		
		  var onUnhandledRejection = function onUnhandledRejection(err) {
		    if (typeof console !== 'undefined' && console) {
		      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
		    }
		  };
		
		  // Polyfill for Function.prototype.bind
		  function bind(fn, thisArg) {
		    return function () {
		      fn.apply(thisArg, arguments);
		    };
		  }
		
		  function Promise(fn) {
		    if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
		    if (typeof fn !== 'function') throw new TypeError('not a function');
		    this._state = 0;
		    this._handled = false;
		    this._value = undefined;
		    this._deferreds = [];
		
		    doResolve(fn, this);
		  }
		
		  function handle(self, deferred) {
		    while (self._state === 3) {
		      self = self._value;
		    }
		    if (self._state === 0) {
		      self._deferreds.push(deferred);
		      return;
		    }
		    self._handled = true;
		    asap(function () {
		      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
		      if (cb === null) {
		        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
		        return;
		      }
		      var ret;
		      try {
		        ret = cb(self._value);
		      } catch (e) {
		        reject(deferred.promise, e);
		        return;
		      }
		      resolve(deferred.promise, ret);
		    });
		  }
		
		  function resolve(self, newValue) {
		    try {
		      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
		      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
		      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
		        var then = newValue.then;
		        if (newValue instanceof Promise) {
		          self._state = 3;
		          self._value = newValue;
		          finale(self);
		          return;
		        } else if (typeof then === 'function') {
		          doResolve(bind(then, newValue), self);
		          return;
		        }
		      }
		      self._state = 1;
		      self._value = newValue;
		      finale(self);
		    } catch (e) {
		      reject(self, e);
		    }
		  }
		
		  function reject(self, newValue) {
		    self._state = 2;
		    self._value = newValue;
		    finale(self);
		  }
		
		  function finale(self) {
		    if (self._state === 2 && self._deferreds.length === 0) {
		      asap(function() {
		        if (!self._handled) {
		          onUnhandledRejection(self._value);
		        }
		      });
		    }
		
		    for (var i = 0, len = self._deferreds.length; i < len; i++) {
		      handle(self, self._deferreds[i]);
		    }
		    self._deferreds = null;
		  }
		
		  function Handler(onFulfilled, onRejected, promise) {
		    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
		    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
		    this.promise = promise;
		  }
		
		  /**
		   * Take a potentially misbehaving resolver function and make sure
		   * onFulfilled and onRejected are only called once.
		   *
		   * Makes no guarantees about asynchrony.
		   */
		  function doResolve(fn, self) {
		    var done = false;
		    try {
		      fn(function (value) {
		        if (done) return;
		        done = true;
		        resolve(self, value);
		      }, function (reason) {
		        if (done) return;
		        done = true;
		        reject(self, reason);
		      });
		    } catch (ex) {
		      if (done) return;
		      done = true;
		      reject(self, ex);
		    }
		  }
		
		  Promise.prototype['catch'] = function (onRejected) {
		    return this.then(null, onRejected);
		  };
		
		  Promise.prototype.then = function (onFulfilled, onRejected) {
		    var prom = new (this.constructor)(noop);
		
		    handle(this, new Handler(onFulfilled, onRejected, prom));
		    return prom;
		  };
		
		  Promise.all = function (arr) {
		    var args = Array.prototype.slice.call(arr);
		
		    return new Promise(function (resolve, reject) {
		      if (args.length === 0) return resolve([]);
		      var remaining = args.length;
		
		      function res(i, val) {
		        try {
		          if (val && (typeof val === 'object' || typeof val === 'function')) {
		            var then = val.then;
		            if (typeof then === 'function') {
		              then.call(val, function (val) {
		                res(i, val);
		              }, reject);
		              return;
		            }
		          }
		          args[i] = val;
		          if (--remaining === 0) {
		            resolve(args);
		          }
		        } catch (ex) {
		          reject(ex);
		        }
		      }
		
		      for (var i = 0; i < args.length; i++) {
		        res(i, args[i]);
		      }
		    });
		  };
		
		  Promise.resolve = function (value) {
		    if (value && typeof value === 'object' && value.constructor === Promise) {
		      return value;
		    }
		
		    return new Promise(function (resolve) {
		      resolve(value);
		    });
		  };
		
		  Promise.reject = function (value) {
		    return new Promise(function (resolve, reject) {
		      reject(value);
		    });
		  };
		
		  Promise.race = function (values) {
		    return new Promise(function (resolve, reject) {
		      for (var i = 0, len = values.length; i < len; i++) {
		        values[i].then(resolve, reject);
		      }
		    });
		  };
		
		  /**
		   * Set the immediate function to execute callbacks
		   * @param fn {function} Function to execute
		   * @private
		   */
		  Promise._setImmediateFn = function _setImmediateFn(fn) {
		    asap = fn;
		  };
		
		  Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
		    onUnhandledRejection = fn;
		  };
		
		  if (typeof module !== 'undefined' && module.exports) {
		    module.exports = Promise;
		  } else if (!root.Promise) {
		    root.Promise = Promise;
		  }
		
		})(this);
		
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).setImmediate));

	/***/ },
	/* 2 */
	/***/ function(module, exports, __webpack_require__) {

		/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(3).nextTick;
		var apply = Function.prototype.apply;
		var slice = Array.prototype.slice;
		var immediateIds = {};
		var nextImmediateId = 0;
		
		// DOM APIs, for completeness
		
		exports.setTimeout = function() {
		  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
		};
		exports.setInterval = function() {
		  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
		};
		exports.clearTimeout =
		exports.clearInterval = function(timeout) { timeout.close(); };
		
		function Timeout(id, clearFn) {
		  this._id = id;
		  this._clearFn = clearFn;
		}
		Timeout.prototype.unref = Timeout.prototype.ref = function() {};
		Timeout.prototype.close = function() {
		  this._clearFn.call(window, this._id);
		};
		
		// Does not start the time, just sets up the members needed.
		exports.enroll = function(item, msecs) {
		  clearTimeout(item._idleTimeoutId);
		  item._idleTimeout = msecs;
		};
		
		exports.unenroll = function(item) {
		  clearTimeout(item._idleTimeoutId);
		  item._idleTimeout = -1;
		};
		
		exports._unrefActive = exports.active = function(item) {
		  clearTimeout(item._idleTimeoutId);
		
		  var msecs = item._idleTimeout;
		  if (msecs >= 0) {
		    item._idleTimeoutId = setTimeout(function onTimeout() {
		      if (item._onTimeout)
		        item._onTimeout();
		    }, msecs);
		  }
		};
		
		// That's not how node.js implements it but the exposed api is the same.
		exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
		  var id = nextImmediateId++;
		  var args = arguments.length < 2 ? false : slice.call(arguments, 1);
		
		  immediateIds[id] = true;
		
		  nextTick(function onNextTick() {
		    if (immediateIds[id]) {
		      // fn.call() is faster so we optimize for the common use-case
		      // @see http://jsperf.com/call-apply-segu
		      if (args) {
		        fn.apply(null, args);
		      } else {
		        fn.call(null);
		      }
		      // Prevent ids from leaking
		      exports.clearImmediate(id);
		    }
		  });
		
		  return id;
		};
		
		exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
		  delete immediateIds[id];
		};
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).setImmediate, __webpack_require__(2).clearImmediate));

	/***/ },
	/* 3 */
	/***/ function(module, exports) {

		// shim for using process in browser
		
		var process = module.exports = {};
		
		// cached from whatever global is present so that test runners that stub it
		// don't break things.  But we need to wrap it in a try catch in case it is
		// wrapped in strict mode code which doesn't define any globals.  It's inside a
		// function because try/catches deoptimize in certain engines.
		
		var cachedSetTimeout;
		var cachedClearTimeout;
		
		(function () {
		  try {
		    cachedSetTimeout = setTimeout;
		  } catch (e) {
		    cachedSetTimeout = function () {
		      throw new Error('setTimeout is not defined');
		    };
		  }
		  try {
		    cachedClearTimeout = clearTimeout;
		  } catch (e) {
		    cachedClearTimeout = function () {
		      throw new Error('clearTimeout is not defined');
		    };
		  }
		} ());
		var queue = [];
		var draining = false;
		var currentQueue;
		var queueIndex = -1;
		
		function cleanUpNextTick() {
		    if (!draining || !currentQueue) {
		        return;
		    }
		    draining = false;
		    if (currentQueue.length) {
		        queue = currentQueue.concat(queue);
		    } else {
		        queueIndex = -1;
		    }
		    if (queue.length) {
		        drainQueue();
		    }
		}
		
		function drainQueue() {
		    if (draining) {
		        return;
		    }
		    var timeout = cachedSetTimeout(cleanUpNextTick);
		    draining = true;
		
		    var len = queue.length;
		    while(len) {
		        currentQueue = queue;
		        queue = [];
		        while (++queueIndex < len) {
		            if (currentQueue) {
		                currentQueue[queueIndex].run();
		            }
		        }
		        queueIndex = -1;
		        len = queue.length;
		    }
		    currentQueue = null;
		    draining = false;
		    cachedClearTimeout(timeout);
		}
		
		process.nextTick = function (fun) {
		    var args = new Array(arguments.length - 1);
		    if (arguments.length > 1) {
		        for (var i = 1; i < arguments.length; i++) {
		            args[i - 1] = arguments[i];
		        }
		    }
		    queue.push(new Item(fun, args));
		    if (queue.length === 1 && !draining) {
		        cachedSetTimeout(drainQueue, 0);
		    }
		};
		
		// v8 likes predictible objects
		function Item(fun, array) {
		    this.fun = fun;
		    this.array = array;
		}
		Item.prototype.run = function () {
		    this.fun.apply(null, this.array);
		};
		process.title = 'browser';
		process.browser = true;
		process.env = {};
		process.argv = [];
		process.version = ''; // empty string to avoid regexp issues
		process.versions = {};
		
		function noop() {}
		
		process.on = noop;
		process.addListener = noop;
		process.once = noop;
		process.off = noop;
		process.removeListener = noop;
		process.removeAllListeners = noop;
		process.emit = noop;
		
		process.binding = function (name) {
		    throw new Error('process.binding is not supported');
		};
		
		process.cwd = function () { return '/' };
		process.chdir = function (dir) {
		    throw new Error('process.chdir is not supported');
		};
		process.umask = function() { return 0; };


	/***/ },
	/* 4 */
	/***/ function(module, exports, __webpack_require__) {

		var Utils = __webpack_require__(5);
		
		/**
		 * BaseTransition to extend
		 *
		 * @namespace Barba.BaseTransition
		 * @type {Object}
		 */
		var BaseTransition = {
		  /**
		   * @memberOf Barba.BaseTransition
		   * @type {HTMLElement}
		   */
		  oldContainer: undefined,
		
		  /**
		   * @memberOf Barba.BaseTransition
		   * @type {HTMLElement}
		   */
		  newContainer: undefined,
		
		  /**
		   * @memberOf Barba.BaseTransition
		   * @type {Promise}
		   */
		  newContainerLoading: undefined,
		
		  /**
		   * Helper to extend the object
		   *
		   * @memberOf Barba.BaseTransition
		   * @param  {Object} newObject
		   * @return {Object} newInheritObject
		   */
		  extend: function(obj){
		    return Utils.extend(this, obj);
		  },
		
		  /**
		   * This function is called from Pjax module to initialize
		   * the transition.
		   *
		   * @memberOf Barba.BaseTransition
		   * @private
		   * @param  {HTMLElement} oldContainer
		   * @param  {Promise} newContainer
		   * @return {Promise}
		   */
		  init: function(oldContainer, newContainer) {
		    var _this = this;
		
		    this.oldContainer = oldContainer;
		    this._newContainerPromise = newContainer;
		
		    this.deferred = Utils.deferred();
		    this.newContainerReady = Utils.deferred();
		    this.newContainerLoading = this.newContainerReady.promise;
		
		    this.start();
		
		    this._newContainerPromise.then(function(newContainer) {
		      _this.newContainer = newContainer;
		      _this.newContainerReady.resolve();
		    });
		
		    return this.deferred.promise;
		  },
		
		  /**
		   * This function needs to be called as soon the Transition is finished
		   *
		   * @memberOf Barba.BaseTransition
		   */
		  done: function() {
		    this.oldContainer.parentNode.removeChild(this.oldContainer);
		    this.newContainer.style.visibility = 'visible';
		    this.deferred.resolve();
		  },
		
		  /**
		   * Constructor for your Transition
		   *
		   * @memberOf Barba.BaseTransition
		   * @abstract
		   */
		  start: function() {},
		};
		
		module.exports = BaseTransition;


	/***/ },
	/* 5 */
	/***/ function(module, exports) {

		/**
		 * Just an object with some helpful functions
		 *
		 * @type {Object}
		 * @namespace Barba.Utils
		 */
		var Utils = {
		  /**
		   * Return the current url
		   *
		   * @memberOf Barba.Utils
		   * @return {String} currentUrl
		   */
		  getCurrentUrl: function() {
		    return window.location.protocol + '//' +
		           window.location.host +
		           window.location.pathname +
		           window.location.search;
		  },
		
		  /**
		   * Given an url, return it without the hash
		   *
		   * @memberOf Barba.Utils
		   * @private
		   * @param  {String} url
		   * @return {String} newCleanUrl
		   */
		  cleanLink: function(url) {
		    return url.replace(/#.*/, '');
		  },
		
		  /**
		   * Time in millisecond after the xhr request goes in timeout
		   *
		   * @memberOf Barba.Utils
		   * @type {Number}
		   * @default
		   */
		  xhrTimeout: 5000,
		
		  /**
		   * Start an XMLHttpRequest() and return a Promise
		   *
		   * @memberOf Barba.Utils
		   * @param  {String} url
		   * @return {Promise}
		   */
		  xhr: function(url) {
		    var deferred = this.deferred();
		    var req = new XMLHttpRequest();
		
		    req.onreadystatechange = function() {
		      if (req.readyState === 4) {
		        if (req.status === 200) {
		          return deferred.resolve(req.responseText);
		        } else {
		          return deferred.reject(new Error('xhr: HTTP code is not 200'));
		        }
		      }
		    };
		
		    req.ontimeout = function() {
		      return deferred.reject(new Error('xhr: Timeout exceeded'));
		    };
		
		    req.open('GET', url);
		    req.timeout = this.xhrTimeout;
		    req.setRequestHeader('x-barba', 'yes');
		    req.send();
		
		    return deferred.promise;
		  },
		
		  /**
		   * Get obj and props and return a new object with the property merged
		   *
		   * @memberOf Barba.Utils
		   * @param  {object} obj
		   * @param  {object} props
		   * @return {object}
		   */
		  extend: function(obj, props) {
		    var newObj = Object.create(obj);
		
		    for(var prop in props) {
		      if(props.hasOwnProperty(prop)) {
		        newObj[prop] = props[prop];
		      }
		    }
		
		    return newObj;
		  },
		
		  /**
		   * Return a new "Deferred" object
		   * https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Deferred
		   *
		   * @memberOf Barba.Utils
		   * @return {Deferred}
		   */
		  deferred: function() {
		    return new function() {
		      this.resolve = null;
		      this.reject = null;
		
		      this.promise = new Promise(function(resolve, reject) {
		        this.resolve = resolve;
		        this.reject = reject;
		      }.bind(this));
		    };
		  },
		
		  /**
		   * Return the port number normalized, eventually you can pass a string to be normalized.
		   *
		   * @memberOf Barba.Utils
		   * @private
		   * @param  {String} p
		   * @return {Int} port
		   */
		  getPort: function(p) {
		    var port = typeof p !== 'undefined' ? p : window.location.port;
		    var protocol = window.location.protocol;
		
		    if (port != '')
		      return parseInt(port);
		
		    if (protocol === 'http:')
		      return 80;
		
		    if (protocol === 'https:')
		      return 443;
		  }
		};
		
		module.exports = Utils;


	/***/ },
	/* 6 */
	/***/ function(module, exports, __webpack_require__) {

		var Dispatcher = __webpack_require__(7);
		var Utils = __webpack_require__(5);
		
		/**
		 * BaseView to be extended
		 *
		 * @namespace Barba.BaseView
		 * @type {Object}
		 */
		var BaseView  = {
		  /**
		   * Namespace of the view.
		   * (need to be associated with the data-namespace of the container)
		   *
		   * @memberOf Barba.BaseView
		   * @type {String}
		   */
		  namespace: null,
		
		  /**
		   * Helper to extend the object
		   *
		   * @memberOf Barba.BaseView
		   * @param  {Object} newObject
		   * @return {Object} newInheritObject
		   */
		  extend: function(obj){
		    return Utils.extend(this, obj);
		  },
		
		  /**
		   * Init the view.
		   * P.S. Is suggested to init the view before starting Barba.Pjax.start(),
		   * in this way .onEnter() and .onEnterCompleted() will be fired for the current
		   * container when the page is loaded.
		   *
		   * @memberOf Barba.BaseView
		   */
		  init: function() {
		    var _this = this;
		
		    Dispatcher.on('initStateChange',
		      function(newStatus, oldStatus) {
		        if (oldStatus && oldStatus.namespace === _this.namespace)
		          _this.onLeave();
		      }
		    );
		
		    Dispatcher.on('newPageReady',
		      function(newStatus, oldStatus, container) {
		        _this.container = container;
		
		        if (newStatus.namespace === _this.namespace)
		          _this.onEnter();
		      }
		    );
		
		    Dispatcher.on('transitionCompleted',
		      function(newStatus, oldStatus) {
		        if (newStatus.namespace === _this.namespace)
		          _this.onEnterCompleted();
		
		        if (oldStatus && oldStatus.namespace === _this.namespace)
		          _this.onLeaveCompleted();
		      }
		    );
		  },
		
		 /**
		  * This function will be fired when the container
		  * is ready and attached to the DOM.
		  *
		  * @memberOf Barba.BaseView
		  * @abstract
		  */
		  onEnter: function() {},
		
		  /**
		   * This function will be fired when the transition
		   * to this container has just finished.
		   *
		   * @memberOf Barba.BaseView
		   * @abstract
		   */
		  onEnterCompleted: function() {},
		
		  /**
		   * This function will be fired when the transition
		   * to a new container has just started.
		   *
		   * @memberOf Barba.BaseView
		   * @abstract
		   */
		  onLeave: function() {},
		
		  /**
		   * This function will be fired when the container
		   * has just been removed from the DOM.
		   *
		   * @memberOf Barba.BaseView
		   * @abstract
		   */
		  onLeaveCompleted: function() {}
		};
		
		module.exports = BaseView;


	/***/ },
	/* 7 */
	/***/ function(module, exports) {

		/**
		 * Little Dispatcher inspired by MicroEvent.js
		 *
		 * @namespace Barba.Dispatcher
		 * @type {Object}
		 */
		var Dispatcher = {
		  /**
		   * Object that keeps all the events
		   *
		   * @memberOf Barba.Dispatcher
		   * @readOnly
		   * @type {Object}
		   */
		  events: {},
		
		  /**
		   * Bind a callback to an event
		   *
		   * @memberOf Barba.Dispatcher
		   * @param  {String} eventName
		   * @param  {Function} function
		   */
		  on: function(e, f) {
		    this.events[e] = this.events[e] || [];
		    this.events[e].push(f);
		  },
		
		  /**
		   * Unbind event
		   *
		   * @memberOf Barba.Dispatcher
		   * @param  {String} eventName
		   * @param  {Function} function
		   */
		  off: function(e, f) {
		    if(e in this.events === false)
		      return;
		
		    this.events[e].splice(this.events[e].indexOf(f), 1);
		  },
		
		  /**
		   * Fire the event running all the event associated to it
		   *
		   * @memberOf Barba.Dispatcher
		   * @param  {String} eventName
		   * @param  {...*} args
		   */
		  trigger: function(e) {//e, ...args
		    if (e in this.events === false)
		      return;
		
		    for(var i = 0; i < this.events[e].length; i++){
		      this.events[e][i].apply(this, Array.prototype.slice.call(arguments, 1));
		    }
		  }
		};
		
		module.exports = Dispatcher;


	/***/ },
	/* 8 */
	/***/ function(module, exports, __webpack_require__) {

		var Utils = __webpack_require__(5);
		
		/**
		 * BaseCache it's a simple static cache
		 *
		 * @namespace Barba.BaseCache
		 * @type {Object}
		 */
		var BaseCache = {
		  /**
		   * The Object that keeps all the key value information
		   *
		   * @memberOf Barba.BaseCache
		   * @type {Object}
		   */
		  data: {},
		
		  /**
		   * Helper to extend this object
		   *
		   * @memberOf Barba.BaseCache
		   * @private
		   * @param  {Object} newObject
		   * @return {Object} newInheritObject
		   */
		  extend: function(obj) {
		    return Utils.extend(this, obj);
		  },
		
		  /**
		   * Set a key and value data, mainly Barba is going to save promises
		   *
		   * @memberOf Barba.BaseCache
		   * @param {String} key
		   * @param {*} value
		   */
		  set: function(key, val) {
		    this.data[key] = val;
		  },
		
		  /**
		   * Retrieve the data using the key
		   *
		   * @memberOf Barba.BaseCache
		   * @param  {String} key
		   * @return {*}
		   */
		  get: function(key) {
		    return this.data[key];
		  },
		
		  /**
		   * Flush the cache
		   *
		   * @memberOf Barba.BaseCache
		   */
		  reset: function() {
		    this.data = {};
		  }
		};
		
		module.exports = BaseCache;


	/***/ },
	/* 9 */
	/***/ function(module, exports) {

		/**
		 * HistoryManager helps to keep track of the navigation
		 *
		 * @namespace Barba.HistoryManager
		 * @type {Object}
		 */
		var HistoryManager = {
		  /**
		   * Keep track of the status in historic order
		   *
		   * @memberOf Barba.HistoryManager
		   * @readOnly
		   * @type {Array}
		   */
		  history: [],
		
		  /**
		   * Add a new set of url and namespace
		   *
		   * @memberOf Barba.HistoryManager
		   * @param {String} url
		   * @param {String} namespace
		   * @private
		   */
		  add: function(url, namespace) {
		    if (!namespace)
		      namespace = undefined;
		
		    this.history.push({
		      url: url,
		      namespace: namespace
		    });
		  },
		
		  /**
		   * Return information about the current status
		   *
		   * @memberOf Barba.HistoryManager
		   * @return {Object}
		   */
		  currentStatus: function() {
		    return this.history[this.history.length - 1];
		  },
		
		  /**
		   * Return information about the previous status
		   *
		   * @memberOf Barba.HistoryManager
		   * @return {Object}
		   */
		  prevStatus: function() {
		    var history = this.history;
		
		    if (history.length < 2)
		      return null;
		
		    return history[history.length - 2];
		  }
		};
		
		module.exports = HistoryManager;


	/***/ },
	/* 10 */
	/***/ function(module, exports, __webpack_require__) {

		var Utils = __webpack_require__(5);
		var Dispatcher = __webpack_require__(7);
		var HideShowTransition = __webpack_require__(11);
		var BaseCache = __webpack_require__(8);
		
		var HistoryManager = __webpack_require__(9);
		var Dom = __webpack_require__(12);
		
		/**
		 * Pjax is a static object with main function
		 *
		 * @namespace Barba.Pjax
		 * @borrows Dom as Dom
		 * @type {Object}
		 */
		var Pjax = {
		  Dom: Dom,
		  History: HistoryManager,
		  Cache: BaseCache,
		
		  /**
		   * Indicate wether or not use the cache
		   *
		   * @memberOf Barba.Pjax
		   * @type {Boolean}
		   * @default
		   */
		  cacheEnabled: true,
		
		  /**
		   * Indicate if there is an animation in progress
		   *
		   * @memberOf Barba.Pjax
		   * @readOnly
		   * @type {Boolean}
		   */
		  transitionProgress: false,
		
		  /**
		   * Class name used to ignore links
		   *
		   * @memberOf Barba.Pjax
		   * @type {String}
		   * @default
		   */
		  ignoreClassLink: 'no-barba',
		
		  /**
		   * Function to be called to start Pjax
		   *
		   * @memberOf Barba.Pjax
		   */
		  start: function() {
		    this.init();
		  },
		
		  /**
		   * Init the events
		   *
		   * @memberOf Barba.Pjax
		   * @private
		   */
		  init: function() {
		    var container = this.Dom.getContainer();
		    var wrapper = this.Dom.getWrapper();
		
		    wrapper.setAttribute('aria-live', 'polite');
		
		    this.History.add(
		      this.getCurrentUrl(),
		      this.Dom.getNamespace(container)
		    );
		
		    //Fire for the current view.
		    Dispatcher.trigger('initStateChange', this.History.currentStatus());
		    Dispatcher.trigger('newPageReady',
		      this.History.currentStatus(),
		      {},
		      container,
		      this.Dom.currentHTML
		    );
		    Dispatcher.trigger('transitionCompleted', this.History.currentStatus());
		
		    this.bindEvents();
		  },
		
		  /**
		   * Attach the eventlisteners
		   *
		   * @memberOf Barba.Pjax
		   * @private
		   */
		  bindEvents: function() {
		    document.addEventListener('click',
		      this.onLinkClick.bind(this)
		    );
		
		    window.addEventListener('popstate',
		      this.onStateChange.bind(this)
		    );
		  },
		
		  /**
		   * Return the currentURL cleaned
		   *
		   * @memberOf Barba.Pjax
		   * @return {String} currentUrl
		   */
		  getCurrentUrl: function() {
		    return Utils.cleanLink(
		      Utils.getCurrentUrl()
		    );
		  },
		
		  /**
		   * Change the URL with pushstate and trigger the state change
		   *
		   * @memberOf Barba.Pjax
		   * @param {String} newUrl
		   */
		  goTo: function(url) {
		    window.history.pushState(null, null, url);
		    this.onStateChange();
		  },
		
		  /**
		   * Force the browser to go to a certain url
		   *
		   * @memberOf Barba.Pjax
		   * @param {String} url
		   * @private
		   */
		  forceGoTo: function(url) {
		    window.location = url;
		  },
		
		  /**
		   * Load an url, will start an xhr request or load from the cache
		   *
		   * @memberOf Barba.Pjax
		   * @private
		   * @param  {String} url
		   * @return {Promise}
		   */
		  load: function(url) {
		    var deferred = Utils.deferred();
		    var _this = this;
		    var xhr;
		
		    xhr = this.Cache.get(url);
		
		    if (!xhr) {
		      xhr = Utils.xhr(url);
		      this.Cache.set(url, xhr);
		    }
		
		    xhr.then(
		      function(data) {
		        var container = _this.Dom.parseResponse(data);
		
		        _this.Dom.putContainer(container);
		
		        if (!_this.cacheEnabled)
		          _this.Cache.reset();
		
		        deferred.resolve(container);
		      },
		      function() {
		        //Something went wrong (timeout, 404, 505...)
		        _this.forceGoTo(url);
		
		        deferred.reject();
		      }
		    );
		
		    return deferred.promise;
		  },
		
		  /**
		   * Get the .href parameter out of an element
		   * and handle special cases (like xlink:href)
		   *
		   * @private
		   * @memberOf Barba.Pjax
		   * @param  {HTMLElement} el
		   * @return {String} href
		   */
		  getHref: function(el) {
		    if (!el) {
		      return undefined;
		    }
		
		    if (el.getAttribute && typeof el.getAttribute('xlink:href') === 'string') {
		      return el.getAttribute('xlink:href');
		    }
		
		    if (typeof el.href === 'string') {
		      return el.href;
		    }
		
		    return undefined;
		  },
		
		  /**
		   * Callback called from click event
		   *
		   * @memberOf Barba.Pjax
		   * @private
		   * @param {MouseEvent} evt
		   */
		  onLinkClick: function(evt) {
		    var el = evt.target;
		
		    //Go up in the nodelist until we
		    //find something with an href
		    while (el && !this.getHref(el)) {
		      el = el.parentNode;
		    }
		
		    if (this.preventCheck(evt, el)) {
		      evt.stopPropagation();
		      evt.preventDefault();
		
		      Dispatcher.trigger('linkClicked', el, evt);
		
		      var href = this.getHref(el);
		      this.goTo(href);
		    }
		  },
		
		  /**
		   * Determine if the link should be followed
		   *
		   * @memberOf Barba.Pjax
		   * @param  {MouseEvent} evt
		   * @param  {HTMLElement} element
		   * @return {Boolean}
		   */
		  preventCheck: function(evt, element) {
		    if (!window.history.pushState)
		      return false;
		
		    var href = this.getHref(element);
		
		    //User
		    if (!element || !href)
		      return false;
		
		    //Middle click, cmd click, and ctrl click
		    if (evt.which > 1 || evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey)
		      return false;
		
		    //Ignore target with _blank target
		    if (element.target && element.target === '_blank')
		      return false;
		
		    //Check if it's the same domain
		    if (window.location.protocol !== element.protocol || window.location.hostname !== element.hostname)
		      return false;
		
		    //Check if the port is the same
		    if (Utils.getPort() !== Utils.getPort(element.port))
		      return false;
		
		    //Ignore case when a hash is being tacked on the current URL
		    if (href.indexOf('#') > -1)
		      return false;
		
		    //Ignore case where there is download attribute
		    if (element.getAttribute && typeof element.getAttribute('download') === 'string')
		      return false;
		
		    //In case you're trying to load the same page
		    if (Utils.cleanLink(href) == Utils.cleanLink(location.href))
		      return false;
		
		    if (element.classList.contains(this.ignoreClassLink))
		      return false;
		
		    return true;
		  },
		
		  /**
		   * Return a transition object
		   *
		   * @memberOf Barba.Pjax
		   * @return {Barba.Transition} Transition object
		   */
		  getTransition: function() {
		    //User customizable
		    return HideShowTransition;
		  },
		
		  /**
		   * Method called after a 'popstate' or from .goTo()
		   *
		   * @memberOf Barba.Pjax
		   * @private
		   */
		  onStateChange: function() {
		    var newUrl = this.getCurrentUrl();
		
		    if (this.transitionProgress)
		      this.forceGoTo(newUrl);
		
		    if (this.History.currentStatus().url === newUrl)
		      return false;
		
		    this.History.add(newUrl);
		
		    var newContainer = this.load(newUrl);
		    var transition = Object.create(this.getTransition());
		
		    this.transitionProgress = true;
		
		    Dispatcher.trigger('initStateChange',
		      this.History.currentStatus(),
		      this.History.prevStatus()
		    );
		
		    var transitionInstance = transition.init(
		      this.Dom.getContainer(),
		      newContainer
		    );
		
		    newContainer.then(
		      this.onNewContainerLoaded.bind(this)
		    );
		
		    transitionInstance.then(
		      this.onTransitionEnd.bind(this)
		    );
		  },
		
		  /**
		   * Function called as soon the new container is ready
		   *
		   * @memberOf Barba.Pjax
		   * @private
		   * @param {HTMLElement} container
		   */
		  onNewContainerLoaded: function(container) {
		    var currentStatus = this.History.currentStatus();
		    currentStatus.namespace = this.Dom.getNamespace(container);
		
		    Dispatcher.trigger('newPageReady',
		      this.History.currentStatus(),
		      this.History.prevStatus(),
		      container,
		      this.Dom.currentHTML
		    );
		  },
		
		  /**
		   * Function called as soon the transition is finished
		   *
		   * @memberOf Barba.Pjax
		   * @private
		   */
		  onTransitionEnd: function() {
		    this.transitionProgress = false;
		
		    Dispatcher.trigger('transitionCompleted',
		      this.History.currentStatus(),
		      this.History.prevStatus()
		    );
		  }
		};
		
		module.exports = Pjax;


	/***/ },
	/* 11 */
	/***/ function(module, exports, __webpack_require__) {

		var BaseTransition = __webpack_require__(4);
		
		/**
		 * Basic Transition object, wait for the new Container to be ready,
		 * scroll top, and finish the transition (removing the old container and displaying the new one)
		 *
		 * @private
		 * @namespace Barba.HideShowTransition
		 * @augments Barba.BaseTransition
		 */
		var HideShowTransition = BaseTransition.extend({
		  start: function() {
		    this.newContainerLoading.then(this.finish.bind(this));
		  },
		
		  finish: function() {
		    document.body.scrollTop = 0;
		    this.done();
		  }
		});
		
		module.exports = HideShowTransition;


	/***/ },
	/* 12 */
	/***/ function(module, exports) {

		/**
		 * Object that is going to deal with DOM parsing/manipulation
		 *
		 * @namespace Barba.Pjax.Dom
		 * @type {Object}
		 */
		var Dom = {
		  /**
		   * The name of the data attribute on the container
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @type {String}
		   * @default
		   */
		  dataNamespace: 'namespace',
		
		  /**
		   * Id of the main wrapper
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @type {String}
		   * @default
		   */
		  wrapperId: 'barba-wrapper',
		
		  /**
		   * Class name used to identify the containers
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @type {String}
		   * @default
		   */
		  containerClass: 'barba-container',
		
		  /**
		   * Full HTML String of the current page.
		   * By default is the innerHTML of the initial loaded page.
		   *
		   * Each time a new page is loaded, the value is the response of the xhr call.
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @type {String}
		   */
		  currentHTML: document.documentElement.innerHTML,
		
		  /**
		   * Parse the responseText obtained from the xhr call
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @private
		   * @param  {String} responseText
		   * @return {HTMLElement}
		   */
		  parseResponse: function(responseText) {
		    this.currentHTML = responseText;
		
		    var wrapper = document.createElement('div');
		    wrapper.innerHTML = responseText;
		
		    var titleEl = wrapper.querySelector('title');
		
		    if (titleEl)
		      document.title = titleEl.textContent;
		
		    return this.getContainer(wrapper);
		  },
		
		  /**
		   * Get the main barba wrapper by the ID `wrapperId`
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @return {HTMLElement} element
		   */
		  getWrapper: function() {
		    var wrapper = document.getElementById(this.wrapperId);
		
		    if (!wrapper)
		      throw new Error('Barba.js: wrapper not found!');
		
		    return wrapper;
		  },
		
		  /**
		   * Get the container on the current DOM,
		   * or from an HTMLElement passed via argument
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @private
		   * @param  {HTMLElement} element
		   * @return {HTMLElement}
		   */
		  getContainer: function(element) {
		    if (!element)
		      element = document.body;
		
		    if (!element)
		      throw new Error('Barba.js: DOM not ready!');
		
		    var container = this.parseContainer(element);
		
		    if (container && container.jquery)
		      container = container[0];
		
		    if (!container)
		      throw new Error('Barba.js: no container found');
		
		    return container;
		  },
		
		  /**
		   * Get the namespace of the container
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @private
		   * @param  {HTMLElement} element
		   * @return {String}
		   */
		  getNamespace: function(element) {
		    if (element && element.dataset) {
		      return element.dataset[this.dataNamespace];
		    } else if (element) {
		      return element.getAttribute('data-' + this.dataNamespace);
		    }
		
		    return null;
		  },
		
		  /**
		   * Put the container on the page
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @private
		   * @param  {HTMLElement} element
		   */
		  putContainer: function(element) {
		    element.style.visibility = 'hidden';
		
		    var wrapper = this.getWrapper();
		    wrapper.appendChild(element);
		  },
		
		  /**
		   * Get container selector
		   *
		   * @memberOf Barba.Pjax.Dom
		   * @private
		   * @param  {HTMLElement} element
		   * @return {HTMLElement} element
		   */
		  parseContainer: function(element) {
		    return element.querySelector('.' + this.containerClass);
		  }
		};
		
		module.exports = Dom;


	/***/ },
	/* 13 */
	/***/ function(module, exports, __webpack_require__) {

		var Utils = __webpack_require__(5);
		var Pjax = __webpack_require__(10);
		
		/**
		 * Prefetch
		 *
		 * @namespace Barba.Prefetch
		 * @type {Object}
		 */
		var Prefetch = {
		  /**
		   * Class name used to ignore prefetch on links
		   *
		   * @memberOf Barba.Prefetch
		   * @type {String}
		   * @default
		   */
		  ignoreClassLink: 'no-barba-prefetch',
		
		  /**
		   * Init the event listener on mouseover and touchstart
		   * for the prefetch
		   *
		   * @memberOf Barba.Prefetch
		   */
		  init: function() {
		    if (!window.history.pushState) {
		      return false;
		    }
		
		    document.body.addEventListener('mouseover', this.onLinkEnter.bind(this));
		    document.body.addEventListener('touchstart', this.onLinkEnter.bind(this));
		  },
		
		  /**
		   * Callback for the mousehover/touchstart
		   *
		   * @memberOf Barba.Prefetch
		   * @private
		   * @param  {Object} evt
		   */
		  onLinkEnter: function(evt) {
		    var el = evt.target;
		
		    while (el && !Pjax.getHref(el)) {
		      el = el.parentNode;
		    }
		
		    if (!el || el.classList.contains(this.ignoreClassLink)) {
		      return;
		    }
		
		    var url = Pjax.getHref(el);
		
		    //Check if the link is elegible for Pjax
		    if (Pjax.preventCheck(evt, el) && !Pjax.Cache.get(url)) {
		      var xhr = Utils.xhr(url);
		      Pjax.Cache.set(url, xhr);
		    }
		  }
		};
		
		module.exports = Prefetch;


	/***/ }
	/******/ ])
	});

	});

	var slicedToArray = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;

	    try {
	      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);

	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }

	    return _arr;
	  }

	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (Symbol.iterator in Object(arr)) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

	var toConsumableArray = function (arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

	    return arr2;
	  } else {
	    return Array.from(arr);
	  }
	};

	window.pageState = window.pageState || {
		initialized: false,
		ready: false,
		readyCallbacks: [],
		leaveCallbacks: [],
		scrollPositions: {}
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', onLoad);
	} else {
		onLoad();
	}

	function ready(callback) {
		if (window.pageState.ready) {
			callback();
		} else {
			window.pageState.readyCallbacks.push(callback);
		}
	}
	function leave(callback) {
		window.pageState.leaveCallbacks.push(callback);
	}

	function onReady(container, page) {
		window.pageState.ready = true;
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = window.pageState.readyCallbacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var c = _step.value;
				c();
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		window.pageState.readyCallbacks = [];

		if (window.self === window.top) {
			// mainly for enabling keyboard scroll, because body isn't scrollable, .main is
			container.focus({ preventScroll: true });
		}

		configGtag(page);
	}

	function onLeave(container, page) {
		var _iteratorNormalCompletion2 = true;
		var _didIteratorError2 = false;
		var _iteratorError2 = undefined;

		try {
			for (var _iterator2 = window.pageState.leaveCallbacks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
				var c = _step2.value;
				c();
			}
		} catch (err) {
			_didIteratorError2 = true;
			_iteratorError2 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion2 && _iterator2.return) {
					_iterator2.return();
				}
			} finally {
				if (_didIteratorError2) {
					throw _iteratorError2;
				}
			}
		}

		window.pageState.leaveCallbacks = [];

		window.pageState.scrollPositions[page] = {
			scrollLeft: container.scrollLeft,
			scrollTop: container.scrollTop
		};
	}

	function onLoad() {
		var main = getCurrentMainElement();
		var page = getPageName();
		main.dataset.page = page;

		if (!window.pageState.initialized) {
			window.pageState.initialized = true;

			barba.Pjax.getTransition = function () {
				return transition;
			};

			barba.Pjax.start();
			barba.Prefetch.init();

			var lastHref = window.location.href;
			barba.Dispatcher.on('initStateChange', function (status) {
				var currentLevel = countSeps(lastHref);
				var targetLevel = countSeps(status.url);
				if (targetLevel < currentLevel) {
					document.body.classList.add('page-going-up');
				}
				lastHref = status.url;
			});
			barba.Dispatcher.on('transitionCompleted', function (el) {
				document.body.classList.remove('page-going-up');
			});

			main.classList.add('page-active');
		}

		onReady(main, page);
	}

	var transition = barba.BaseTransition.extend({
		start: function start() {
			var _this = this;

			window.pageState.ready = false;
			onLeave(this.oldContainer, this.oldContainer.dataset.page);

			document.body.classList.add('page-transition');
			document.body.dataset.pageTo = getPageName();
			this.oldContainer.classList.remove('page-active');
			this.oldContainer.classList.add('page-exit');

			Promise.all([
			// prevent too much overlap by setting minimum delay before the next page's transition
			new Promise(function (resolve) {
				return setTimeout(resolve, 400);
			}),

			// load subresources after loading new content
			this.newContainerLoading.then(function () {
				// set page name to allow scoped CSS
				_this.newContainer.dataset.page = getPageName();
				_this.newContainer.classList.remove('page-active');
				_this.newContainer.classList.add('page-idle');
				delete _this.newContainer.style.visibility;

				// transplant new head because Barba.js does not load <head>
				// new head is in the main content in a template called pjax-head
				var newHead = _this.newContainer.querySelector('#pjax-head');

				var newHeadEls = [];
				_this.oldHeadEls = [];

				if (newHead) {
					var newHeadContent = document.importNode(newHead.content, true);

					var _arr = [].concat(toConsumableArray(newHeadContent.children));

					for (var _i = 0; _i < _arr.length; _i++) {
						var c = _arr[_i];
						newHeadEls.push(c);

						var old = document.getElementById(c.id);
						if (old) _this.oldHeadEls.push(old);

						if (c.tagName === 'SCRIPT') {
							// Browsers only execute <scripts> freshly created by createElement
							var clone = document.createElement('script');
							var _iteratorNormalCompletion3 = true;
							var _didIteratorError3 = false;
							var _iteratorError3 = undefined;

							try {
								for (var _iterator3 = c.attributes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
									var attr = _step3.value;

									clone.setAttribute(attr.name, attr.value);
								}
							} catch (err) {
								_didIteratorError3 = true;
								_iteratorError3 = err;
							} finally {
								try {
									if (!_iteratorNormalCompletion3 && _iterator3.return) {
										_iterator3.return();
									}
								} finally {
									if (_didIteratorError3) {
										throw _iteratorError3;
									}
								}
							}

							newHeadContent.replaceChild(clone, c);
						}
					}
					document.head.appendChild(newHeadContent);
					newHead.remove();
				}

				// wait for linked subresources to load
				var linksLoaded = newHeadEls.filter(function (el) {
					return el.tagName === 'LINK';
				}).map(function (el) {
					return new Promise(function (resolve) {
						if (el.sheet || !('onload' in el)) {
							resolve();
						} else {
							el.addEventListener('load', resolve);
							el.addEventListener('error', resolve);
						}
					});
				});
				return Promise.all(linksLoaded);
			})]).then(function () {
				// animate entrance after loading all necessary stuff
				_this.newContainer.classList.remove('page-idle');
				_this.newContainer.classList.add('page-enter');

				// restore scroll position
				var scroll = window.pageState.scrollPositions[_this.newContainer.dataset.page];
				if (scroll) {
					_this.newContainer.scrollLeft = scroll.scrollLeft;
					_this.newContainer.scrollTop = scroll.scrollTop;
				}

				return new Promise(function (resolve) {
					var resolved = false;
					var resolveOnce = function resolveOnce() {
						if (!resolved) resolve();
						resolved = true;
					};

					_this.newContainer.addEventListener('animationend', resolveOnce);

					setTimeout(resolveOnce, 4000); // maximum transition time
				});
			}).then(function () {
				return _this.finish();
			});
		},
		finish: function finish() {
			var _iteratorNormalCompletion4 = true;
			var _didIteratorError4 = false;
			var _iteratorError4 = undefined;

			try {
				for (var _iterator4 = this.oldHeadEls[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
					var el = _step4.value;

					el.remove();
				}
			} catch (err) {
				_didIteratorError4 = true;
				_iteratorError4 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion4 && _iterator4.return) {
						_iterator4.return();
					}
				} finally {
					if (_didIteratorError4) {
						throw _iteratorError4;
					}
				}
			}

			this.oldHeadEls = [];

			document.body.classList.remove('page-transition');
			delete document.body.dataset.pageTo;
			this.newContainer.classList.remove('page-enter');
			this.newContainer.classList.add('page-active');

			this.done();
			onReady(this.newContainer, this.newContainer.dataset.page);
		}
	});

	function getCurrentMainElement() {
		return [].concat(toConsumableArray(document.querySelectorAll('.main'))).pop();
	}

	function getPageName() {
		var pathname = window.location.pathname;
		if (window.location.pathname.endsWith('/')) pathname += 'index.html';
		return pathname.substring(1); // remove front slash
	}

	function countSeps(path) {
		return (path.replace(/\/index.html$/).match(/\//g) || []).length;
	}

	function isReady() {
		return window.pageState.ready;
	}

	function configGtag(page) {
		var id = 'UA-141010266-1';

		if (!('gtag' in window)) {
			window.dataLayer = window.dataLayer || [];
			window.gtag = function () {
				dataLayer.push(arguments);
			};
			gtag('js', new Date());

			var gtagScript = document.createElement('script');
			gtagScript.type = 'text/javascript';
			gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
			gtagScript.async = true;
			document.head.appendChild(gtagScript);
		}

		gtag('config', id, {
			page_title: document.title,
			page_path: '/' + page
		});
	}

	var page = {
		ready: ready,
		leave: leave,
		isReady: isReady,
		getCurrentMainElement: getCurrentMainElement
	};

	var searchPagePath = '/search.html';

	page.ready(function () {
		var header = [].concat(toConsumableArray(document.querySelectorAll('header.header'))).pop();
		var searchForm = [].concat(toConsumableArray(document.querySelectorAll('#header-search'))).pop();
		var searchInput = [].concat(toConsumableArray(document.querySelectorAll('#header-search input'))).pop();

		searchInput.addEventListener('focus', function () {
			header.classList.add('header-searching');
			searchInput.select();
		});

		searchInput.addEventListener('blur', function () {
			setTimeout(function () {
				return header.classList.remove('header-searching');
			}, 100);
		});

		// use hash params instead of query params for performance
		searchForm.addEventListener('submit', function (event) {
			event.preventDefault();
			if (searchInput.value) navigateToSearch(searchInput.value);
		});

		// prefetch search page
		var prefetchSearch = function prefetchSearch() {
			if ((searchInput.value || '').length >= 2) {
				var link = document.createElement('link');
				link.rel = 'preload';
				link.href = searchPagePath;
				link.as = 'fetch';
				document.querySelector('head').appendChild(link);

				searchInput.removeEventListener('change', prefetchSearch);
			}
		};
		searchInput.addEventListener('change', prefetchSearch);
	});

	function navigateToSearch(query) {
		if (window.location.pathname === searchPagePath) {
			window.location.hash = query;
		} else {
			try {
				// Barba may break on hash change
				barba.Pjax.goTo(searchPagePath + '#' + encodeURIComponent(query));
			} catch (err) {
				window.location.href = searchPagePath + '?q=' + encodeURIComponent(query);
			}
		}
	}

	// generates reference IDs to data and back

	function fromRef(data, ref) {
		var refSplit = ref.split('/', 2);
		var type = refSplit[0];
		var id = refSplit[1];
		switch (type) {
			case 'projects':
				var item = data.projects.find(function (p) {
					return p.id === id;
				});
				return { item: item, type: 'project', url: '/works/' + item.id + '.html' };
			default:
				throw new Error('unknown type: ' + type);
		}
	}

	var searchConfig = {
		expand: true
	};

	var http = axios$1.create({
		adapter: cacheAdapterEnhancer(axios$1.defaults.adapter)
	});

	page.ready(function () {

		execQuery();
		window.addEventListener('hashchange', execQuery, false);

		var form = document.querySelector('section.search form.search-form');
		var input = document.querySelector('section.search .search-form input');

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			input.blur();
			search(form.elements.q.value);
		});

		input.addEventListener('focus', function () {
			input.select();
		});
	});

	page.leave(function () {
		window.removeEventListener('hashchange', execQuery);
	});

	function execQuery() {
		var query = '';
		if (window.location.hash.length) {
			query = decodeURIComponent(window.location.hash.substring(1));
		} else {
			// query string fallback
			query = queryString.parse(window.location.search).q || '';
		}

		search(query);
	}

	function search(query) {
		if (!query) return;

		var hash = '#' + encodeURIComponent(query);
		if (window.location.hash !== hash) {
			history.pushState(null, null, '//' + window.location.host + window.location.pathname + hash);
		}

		document.querySelector('section.search .search-form input').value = query;
		document.querySelectorAll('section.search .query').forEach(function (el) {
			return el.innerText = query;
		});

		var resultsContainer = document.querySelector('section.search #results');
		var resultsInfo = document.querySelector('section.search .results-info');
		var resultsInfoCount = document.querySelector('section.search .results-info .count');
		var resultsEmpty = document.querySelector('section.search .results-empty');

		var htmlTemplates = document.querySelectorAll('section.search template[data-item-type]');
		var templates = {};
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = htmlTemplates[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var t = _step.value;

				templates[t.dataset.itemType] = inst$1.compile(t.innerHTML);
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		var existingResults = document.createRange();
		existingResults.selectNodeContents(resultsContainer);
		existingResults.deleteContents();

		Promise.all([http.get('/idx.json'), http.get('/data.json')]).then(function (_ref) {
			var _ref2 = slicedToArray(_ref, 2),
			    idxResp = _ref2[0],
			    dataResp = _ref2[1];

			var idx = elasticlunr_min.Index.load(idxResp.data);
			var results = idx.search(query, searchConfig);
			results = results.filter(function (v) {
				return v.score > 0.3;
			});

			if (results.length) {
				var items = results.map(function (v) {
					return fromRef(dataResp.data, v.ref);
				});
				renderResults(resultsContainer, templates, items);
				resultsInfoCount.textContent = results.length;
				resultsInfo.style.display = 'block';
				resultsEmpty.style.display = 'none';
			} else {
				resultsInfo.style.display = 'none';
				if (query) resultsEmpty.style.display = 'block';
			}
		});
	}

	function renderResults(container, templates, items) {
		items.map(function (item) {
			return renderItem(templates[item.type], item);
		}).forEach(function (content) {
			container.appendChild(content);
		});
	}

	function renderItem(template, item) {
		if (!template) throw new Error('no template');
		var html = document.createElement('template');
		html.innerHTML = template(item);
		return html.content;
	}

}());
