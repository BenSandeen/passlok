﻿//detect mobile and store in global Boolean variable. Learn mode detected by setLearn() below. Detect Basic mode. Who calls Key.
var isMobile = (typeof window.orientation != 'undefined');
var callKey = '';
var BasicButtons = true;
var fullAccess = true;
var allowCancelWfullAccess = false;

//global variables used for key box expiration
var keytimer = 0;
var keytime = new Date().getTime();

//Regex for searching
var searchExp = new RegExp(wordlist.join("|"),"g");
var searchBlackExp = new RegExp(blacklist.join("|"),"g");

//Alphabets for base conversion. Used in making and reading the ezLok format and some fixes to SJCL
var BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz';
var BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(pwd,display) {
	var entropy = entropycalc(pwd);

	if(entropy == 0){
		var msg = 'This is a known <span style="color:magenta">bad Key!</span>';
	}else if(entropy < 20){
		var msg = '<span style="color:magenta">Terrible!</span>';
	}else if(entropy < 40){
		var msg = '<span style="color:red">Weak!</span>';
	}else if(entropy < 60){
		var msg = '<span style="color:orange">Medium</span>';
	}else if(entropy < 90){
		var msg = '<span style="color:green">Good!</span>';
	}else if(entropy < 120){
		var msg = '<span style="color:blue">Great!</span>';
	}else{
		var msg = '<span style="color:cyan">Overkill  !!</span>';
	}
	
	iter = Math.max(1,Math.min(20,Math.ceil(24 - entropy/5)));			//set the scrypt iteration exponent based on entropy: 1 for entropy >= 120, 20(max) for entropy <= 20
	
	var seconds = time10/10000*Math.pow(2,iter-8);			//to tell the user how long it will take, in seconds
	
	if(pwd.trim()==''){
		if(decoyIn.style.display=="block"){
			msg = 'Enter the Decoy Password below'
		}else{
			msg = 'Enter your Key below'
		}
	}else{
		if (BasicButtons){
			msg = 'Key strength: ' + msg + '<br>Up to ' + Math.max(0.01,seconds.toPrecision(3)) + ' sec. to process'
		}else{
			msg = 'Key entropy: ' + Math.round(entropy*100)/100 + ' bits. ' + msg + '<br>Up to ' + Math.max(0.01,seconds.toPrecision(3)) + ' sec. to process'
		}
	}
if(display){																//these are to display the appropriate messages
	if(keyScr.style.display=="block") keyMsg.innerHTML = msg;
	if(decoyIn.style.display=="block") decoyMsg.innerHTML = msg;
	if(introscr3.style.display=="block") introMsg.innerHTML = msg;
	if(keyChange.style.display=="block") keyChangeMsg.innerHTML = msg;
}
	return iter
};

//takes a string and calculates its entropy in bits, taking into account the kinds of characters used and parts that may be in the general wordlist (reduced credit) or the blacklist (no credit)
function entropycalc(pwd){

//find the raw Keyspace
	var numberRegex = new RegExp("^(?=.*[0-9]).*$", "g");
	var smallRegex = new RegExp("^(?=.*[a-z]).*$", "g");
	var capRegex = new RegExp("^(?=.*[A-Z]).*$", "g");
	var base64Regex = new RegExp("^(?=.*[/+]).*$", "g");
	var otherRegex = new RegExp("^(?=.*[^a-zA-Z0-9/+]).*$", "g");

	pwd = pwd.replace(/\s/g,'');										//no credit for spaces

	var Ncount = 0;
	if(numberRegex.test(pwd)){
		Ncount = Ncount + 10;
	}
	if(smallRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(capRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(base64Regex.test(pwd)){
		Ncount = Ncount + 2;
	}
	if(otherRegex.test(pwd)){
		Ncount = Ncount + 31;											//assume only printable characters
	}

//start by finding words that might be on the blacklist (no credit)
	var pwd = reduceVariants(pwd);
	var wordsFound = pwd.match(searchBlackExp);							//array containing words found on the blacklist
	if(wordsFound){
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(wordsFound[i],'');						//remove them from the string
		}
	}

//now look for regular words on the wordlist
	wordsFound = pwd.match(searchExp);									//array containing words found on the regular wordlist
	if(wordsFound){
		wordsFound = wordsFound.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates from the list
		var foundLength = wordsFound.length;							//to give credit for words found we need to count how many
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(new RegExp(wordsFound[i], "g"),'');									//remove all instances
		}
	}else{
		var foundLength = 0;
	}

	pwd = pwd.replace(/(.+?)\1+/g,'$1');								//no credit for repeated consecutive character groups

	if(pwd != ''){
		return (pwd.length*Math.log(Ncount) + foundLength*Math.log(wordlist.length + blacklist.length))/Math.LN2
	}else{
		return (foundLength*Math.log(wordlist.length + blacklist.length))/Math.LN2
	}
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string){
	return string.toLowerCase().replace(/[óòöôõo]/g,'0').replace(/[!íìïîi]/g,'1').replace(/[z]/g,'2').replace(/[éèëêe]/g,'3').replace(/[@áàäâãa]/g,'4').replace(/[$s]/g,'5').replace(/[t]/g,'7').replace(/[b]/g,'8').replace(/[g]/g,'9').replace(/[úùüû]/g,'u');
}

//these derive from the Key after running through scrypt stretching. BitArray format. Dir (salt=userName) is 32-byte, Sgn (salt=email, Edwards curve) is 64-byte; DH (Motgomery curve, deriving from Sgn) is 32-byte, myEmail is a string.
var KeyDir,
	KeySgn,
	KeyDH,
	myEmail = '';

//reads Key box and stops if there's something wrong. If the timer has run out, the Key is deleted from box, and stretched keys are deleted from memory
function readKey(){
	clearTimeout(keytimer);
	var period = 300000;

//start timer to erase Key
	if(!neverMode.checked){
		keytimer = setTimeout(function() {
			resetKeys();
		}, period);
	}
	
//erase key at end of period, by a different way
	if ((new Date().getTime() - keytime > period) && !neverMode.checked) {
		resetKeys();
	}
    keytime = new Date().getTime();

	var key = pwd.value.trim();
	if (key == ""){
		any2key();
		if(callKey == 'initkey'){
			keyMsg.innerHTML = '<span style="color:green"><strong>Welcome to PassLok Privacy</strong></span><br />Please enter your secret Key'
		}else{
			keyMsg.innerHTML = 'Please enter your secret Key';
			shadow.style.display = 'block'
		}
		throw ('secret Key needed')
	}
	return key
}

//resets the Keys in memory when the timer ticks off
function resetKeys(){
	pwd.value = '';
	KeyDir = '';
	KeySgn = '';
	KeyDH = '';
	myEmail = '';
}

//reads email from the box. This is used as a salt to make the Lock
function readEmail(){
	if(myEmail) return myEmail;
	if(locDir['myself'] && fullAccess) return keyDecrypt(locDir['myself'][2]);
	var email = emailBox.value;
	if (email == ""){											//won't trigger if there is a space, thus allowing for empty email strings
		any2email();
		throw ('email needed')
	};
	return email.trim()
}

var userName = '';
//to initialize a new user
function initUser(){
	var key = pwdIntro.value,
		email = emailIntro.value;
	userName = nameIntro.value;
	myEmail = email.trim();

	if (key.trim() == '' || userName.trim() == ''){
		intromsg2.innerHTML = 'The User Name or the Key box is empty<br />Please go back and ensure both are filled.';
		intromsg2.innerHTML = 'The User Name or the Key box is empty<br />Please go back and ensure both are filled.';
		return
	}
	pwd.value = key;
	openClose('introscr5');

	if(!localStorage[userName]){
		locDir = {};
		localStorage[userName] = JSON.stringify(locDir)
	}			
	locDir = JSON.parse(localStorage[userName]);
	mainMsg.innerHTML = '<span class="blink" style="color:red">LOADING...</span> for best speed, use at least a Medium Key';
	key2any();
	
setTimeout(function(){									//do the rest after a short while to give time for the key screen to show
	KeyDir = wiseHash(key,userName);							//storage stretched key loaded into memory, will be used right away

	if(ChromeSyncOn){											//if sync is available, get settings only from sync, then the rest
		var syncName = userName+'.myself';
		chrome.storage.sync.get(syncName.toLowerCase(), function (obj) {
			var lockdata = obj[syncName.toLowerCase()];
			if(lockdata){											//the user isn't totally new: retrieve settings				
				locDir['myself'] = JSON.parse(lockdata);
				email = keyDecrypt(locDir['myself'][2]);			
				retrieveAllSync();
				setTimeout(function(){fillList();mainMsg.innerHTML = 'Settings synced from Chrome';}, 500);
			}else{													//user never seen before: store settings
				locDir['myself'] = [];
				locDir['myself'][2] = keyEncrypt(email);			//the Lock will be stored later	
				setTimeout(function(){fillList();mainMsg.innerHTML = 'To lock a message for someone, enter the recipient’s Lock or shared Key by clicking the <strong>Edit</strong> button';}, 500);			
			}
			if(email) myEmail = email;
			localStorage[userName] = JSON.stringify(locDir);
			lockNames = Object.keys(locDir);
			KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,email)).secretKey;		//make the Edwards curve secret key first
			KeyDH = ed2curve.convertSecretKey(KeySgn);								//and then the Montgomery curve key 
			showLock();
		});
	}else{															//if not, store the email; the Lock will be made and stored by showLock()
		if(!locDir['myself']) locDir['myself'] = [];
		locDir['myself'][2] = keyEncrypt(email);
		localStorage[userName] = JSON.stringify(locDir);
		lockNames = Object.keys(locDir);
		KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,email)).secretKey;
		KeyDH = ed2curve.convertSecretKey(KeySgn);
		showLock();
		setTimeout(function(){fillList();mainMsg.innerHTML = 'To lock a message for someone, enter the recipient’s Lock or shared Key by clicking the <strong>Edit</strong> button';}, 500);
	}	
	getSettings();
	if(inviteBox.checked) sendMail();
},20);
}

//checks that the Key is the same as before, resumes operation
function acceptKey(){
	var key = pwd.value.trim();
	if(key == ''){
		keyMsg.innerHTML = 'Please enter your Key';
		throw("no Key")
	}
	if(key.length < 4){
		keyMsg.innerHTML = '<span style="color:red">This Key is too short</span>';
		throw("short Key")
	}
	if(striptags(key).length == 43 || striptags(key).length == 50){
		keyMsg.innerHTML = '<span style="color:red">This is a Lock. Enter your Key here</span>';
		throw("lock instead of Key")
	}
	
	var x = document.getElementById('nameList');
	if (x.options.length == 2){						//only one user, no need to select it
		userName = x.options[1].value
	}else{												//several users
		for (var i = 0; i < x.options.length; i++) {
    		if(x.options[i].selected){
				userName = x.options[i].value
    		}
  		}
	}
	if (userName == '' && fullAccess){
		keyMsg.innerHTML = 'Please select a user name, or make a new one';
		throw("no userName")
	}
	if(Object.keys(locDir).length == 0 && localStorage[userName]) locDir = JSON.parse(localStorage[userName]);
	if(firstInit) mainMsg.innerHTML = '<span class="blink" style="color:red">LOADING...</span> for best speed, use at least a Medium Key';
	key2any();
	
setTimeout(function(){									//execute after a delay so the key entry dialog can go away
	if(locDir['myself']){
		if(!fullAccess){									//OK so far, now check that the Key is good; at the same time populate email and generate stretched Keys
			locDir['myself'][4] = 'guest mode';
			localStorage[userName] = JSON.stringify(locDir);
			mainMsg.innerHTML = 'You have limited access to functions<br>For full access, reload and enter the Key'
		}
		checkKey(key);
			
		if(ChromeSyncOn){
			syncChromeLock('myself',JSON.stringify(locDir['myself']))
		}
		
		getSettings();
	}else{													//if stored settings are not present: ask for email, compute stretched Keys. Store stuff if full access
		if(firstInit) KeyDir = wiseHash(key,userName);
		
		if(ChromeSyncOn && firstInit){						//the Chrome app gets the settings from sync, asynchronously
			var syncName = userName+'.myself';
    		chrome.storage.sync.get(syncName.toLowerCase(), function (obj) {
				var lockdata = obj[syncName.toLowerCase()];
				if(lockdata){											//the user isn't totally new: retrieve settings				
					locDir['myself'] = JSON.parse(lockdata);
					email = keyDecrypt(locDir['myself'][2]);
					if(email) myEmail = email;
					localStorage[userName] = JSON.stringify(locDir);			
					retrieveAllSync();
					setTimeout(function(){mainMsg.innerHTML = 'Settings retrieved from your Chrome sync area';}, 500);
				}else{													//user missing in sync: store settings
					var email = readEmail();
					locDir['myself'] = [];
					locDir['myself'][2] = keyEncrypt(email);
					localStorage[userName] = JSON.stringify(locDir);
					syncChromeLock('myself',JSON.stringify(locDir['myself']));			
				}			
				lockNames = Object.keys(locDir);
				KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,email)).secretKey;		//make the Edwards curve secret key first
				KeyDH = ed2curve.convertSecretKey(KeySgn);								//and then the Montgomery curve key 
			});
		} else {											//no sync, so ask user for email and go on making Keys
			firstInit = false;
			var email = readEmail();
			KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,email)).secretKey;
			KeyDH = ed2curve.convertSecretKey(KeySgn);
			locDir['myself'] = [];
			locDir['myself'][2] = keyEncrypt(email);
			localStorage[userName] = JSON.stringify(locDir);
		}
		checkboxStore();
	}
	if(Object.keys(locDir).length == 1 || Object.keys(locDir).length == 0){		//new user, so display a fuller message
		mainMsg.innerHTML = 'To lock a message for someone, you must first enter the recipient’s Lock or shared Key by clicking the <strong>Edit</strong> button'
	}
	if (callKey == 'encrypt'){						//now complete whatever was being done when the Key was found missing
		Encrypt_single()
	}else if(callKey == 'decrypt'){
		lockUnlock()
	}else if(callKey == 'sign'){
		applySignature()
	}else if(callKey == 'addlock'){
		openClose('lockScr');
		openClose('shadow');
		addLock()
	}else if(callKey == 'decryptitem'){
		decryptItem()
	}else if(callKey == 'decryptlock'){
		decryptLock()
	}else if(callKey == 'mergedb'){
		mergeLockDB()
	}else if(callKey == 'movedb'){
		moveLockDB()
	} else if(callKey == 'showlock'){
		showLock()
	} else if(callKey == 'fillbox'){
		fillBox()
	} else if(callKey == 'changekey'){
		changeKey()
	} else if(callKey == 'changename'){
		name2any()
	} else if(callKey == 'changeemail'){
		email2any()
	} else if(callKey == 'movemyself'){
		moveMyself()
	}
	focusBox()
},30);
}

var locDir = {},
	lockNames = [],
	myLock,
	myezLock,
	firstInit = true;

//sticky settings are stored in array 'myself' on directory; here is a breakdown of what each index contains:
//0: user's Lock, encrypted by Key; 1: shared Key resulting from combining the user's Key and Lock, encrypted by Key;
//2: email/token, encrypted by Key; 3: checkbox code, plain; 4: full access on or off, plain

//function to initialize locDir and interface for the user
function getSettings(){
	if(userName in localStorage){
		if(Object.keys(locDir).length == 0) locDir = JSON.parse(localStorage[userName]);	//database in Object form. Global variable
		lockNames = Object.keys(locDir);												//array for finding lock names. Global variable	
		if(locDir['myself']){															//initialize permanent settings
			if(fullAccess){
			myLock = keyDecrypt(locDir['myself'][0]);
			myezLock = changeBase(myLock, BASE64, BASE36, true);
			}
			if(!firstInit) return;														//skip the rest if it's not the first time
			if(locDir['myself'][4] == 'guest mode'){
				setTimeout(function(){				//add delay so messages are seen and recrypt doesn't get in the way
					if(fullAccess){
						var reply = confirm("Last user did not enter the right Key. Would you like to re-encrypt the local directory?");
						if(reply){
							recryptDB(pwd.value,userName);
							mainMsg.innerHTML = 'The local directory has been re-encrypted'
						}else{
							mainMsg.innerHTML = '<span style="color:red"><strong>Warning: last session was in Guest mode</strong></span>'
						}
					}else{
						mainMsg.innerHTML = 'Last session was in Guest mode, like this one'
					}
				}, 500);			
				locDir['myself'][4] = 'full access';
				localStorage[userName] = JSON.stringify(locDir);
			}
			code2checkbox();										//set checkboxes

			if(ChromeSyncOn) retrieveAllSync();
		}
	}
	fillList();
	firstInit = false
}

//try decrypting the email/token in 'myself' to see if the Key is the same as the last one used. Then populate email box and generate stretched keys and Lock
var checkingKey = false;
function checkKey(key){
	checkingKey = true;
	KeyDir = wiseHash(key,userName);
	if(fullAccess){
		var myEmailcrypt = locDir['myself'][2];
		var email = keyDecrypt(myEmailcrypt);					//try/catch statement in keyDecrypt() triggers if KeyDir is wrong
		if(email){
			myEmail = email
		}else{
			myEmail = readEmail()
		}
	}else{
		myEmail = readEmail();
	}
	KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,myEmail)).secretKey;
	KeyDH = ed2curve.convertSecretKey(KeySgn);
	if(!myLock){
		if(fullAccess){
			if(locDir['myself'][0]){
				myLock = keyDecrypt(locDir['myself'][0])
			}else{
				myLock = nacl.util.encodeBase64(nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey).replace(/=+$/,'');
				locDir['myself'][0] = keyEncrypt(myLock);
			localStorage[userName] = JSON.stringify(locDir);
			}
		}else{
			myLock = nacl.util.encodeBase64(nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey).replace(/=+$/,'');
		}
		myezLock = changeBase(myLock, BASE64, BASE36, true);
	}
	checkingKey = false;
	return
}

//display Lock in the lower box of the Main tab.
function showLock(){
	callKey = 'showlock';
	mainMsg.innerHTML = "";
	if (learnMode.checked){
		var reply = confirm("The Lock matching the Key in this box will be placed in the lower box, replacing its contents. Cancel if this is not what you want.");
		if(!reply) return;
	};
	
	readKey();
	if(!locDir['myself']) locDir['myself'] = [];
	if(locDir['myself'][0] && fullAccess){							//require full access, since the Lock is stored encrypted
		myLock = keyDecrypt(locDir['myself'][0])
	}else{
		myLock = nacl.util.encodeBase64(nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey).replace(/=+$/,'');	//the Lock derives from the signing Key
		if(fullAccess) storemyLock();
	}
	myezLock = changeBase(myLock, BASE64, BASE36, true);
	
	//done calculating, now display it
	lockDisplay();
	
	if(ChromeSyncOn && fullAccess){
		syncChromeLock('myself',JSON.stringify(locDir['myself']))			//sync the Lock
	}
	
	callKey = '';
};

//just to display the Lock. Gets called above and in one more place
function lockDisplay(){
	if(ezLokMode.checked){
		var mylocktemp = myezLock.replace(/l/g,'L');					//change smallcase l into capital L for display
		if(ReedSolMode.checked){
			var checksum = calcRScode(mylocktemp);
			checksum = '=' + checksum.match(/.{1,5}/g).join("-")
		}else{
			var checksum = ''
		}
		mylocktemp = mylocktemp.match(/.{1,5}/g).join("-");					//split into groups of five, for easy reading		
		if (!noTagsMode.checked) mylocktemp = "PL22ezLok=" + mylocktemp +  checksum + "=PL22ezLok";
	}else{
		var mylocktemp = myLock;
		if(ReedSolMode.checked){
			var checksum = '=' + calcRScode(mylocktemp);
		}else{
			var checksum = ''
		}
		if (!noTagsMode.checked) mylocktemp = "PL22lok=" + mylocktemp + checksum + "=PL22lok"
	}
	mainBox.innerHTML = triple(mylocktemp);
	mainMsg.innerHTML = "The Lock matching your Key is in the box.";	
};

//stores new Lock into local directory, also email if missing
function storemyLock(){
	var mylockcrypt = keyEncrypt(myLock);
	if(!locDir['myself']) locDir['myself'] = [];
	locDir['myself'][0] = mylockcrypt;
	locDir['myself'][2] = keyEncrypt(readEmail());
	localStorage[userName] = JSON.stringify(locDir);
	lockNames = Object.keys(locDir);
	
	if(ChromeSyncOn){
		syncChromeLock('myself',JSON.stringify(locDir['myself']))
	}
}

//stretches a password string with a salt string to make a 256-bit Uint8Array Key
function wiseHash(pwd,salt){
	var iter = keyStrength(pwd,false),
		secArray = new Uint8Array(32),
		keyBytes;
	if(salt.length == 43) iter = 1;								//random salt: no extra stretching needed
	scrypt(pwd,salt,iter,8,32,1000,function(x){keyBytes=x;});
	for(var i=0;i<32;i++){
			secArray[i] = keyBytes[i]
	}
	return secArray
}

//returns milliseconds for 10 scrypt runs at iter=10 so the user can know how long wiseHash will take; called at the end of body script
function hashTime10(){
	var before = Date.now();
	for (var i=0; i<10; i++){
		scrypt('hello','world',10,8,32,1000,function(){});
	}
	return Date.now() - before
}

//makes the DH public string of a DH secret key array. Returns a base64 string
function makePubStr(sec){
	var pub = nacl.box.keyPair.fromSecretKey(sec).publicKey;
	return nacl.util.encodeBase64(pub).replace(/=+$/,'')
}

//Diffie-Hellman combination of a DH public key (string) and a DH secret key array. Returns Uint8Array
function makeShared(pubstr,sec){
	var	pub = nacl.util.decodeBase64(pubstr);
	return nacl.box.before(pub,sec)
}

//makes the DH public key (Montgomery) from a published Lock, which is a Signing public key (Edwards)
function convertPubStr(Lock){
	var pub = nacl.util.decodeBase64(Lock);
	return nacl.util.encodeBase64(ed2curve.convertPublicKey(pub)).replace(/=+$/,'')
}

function makeNonce24(nonce){
	var	result = new Uint8Array(24);
	for(i=0;i<nonce.length;i++){result[i] = nonce[i]};
	return result
}

function PLencrypt(plainstr,nonce24,sharedKey){
	var plain = nacl.util.decodeUTF8(plainstr),
		cipher = nacl.secretbox(plain,nonce24,sharedKey);
	return nacl.util.encodeBase64(cipher).replace(/=+$/,'')
}

function PLdecrypt(cipherstr,nonce24,sharedKey){
	var cipher = nacl.util.decodeBase64(cipherstr),
		plain = nacl.secretbox.open(cipher,nonce24,sharedKey);
		if(!plain) failedDecrypt();
	return nacl.util.encodeUTF8(plain)
}

//this strips initial and final tags, plus spaces and non-base64 characters in the middle
function striptags(string){
	string = string.replace(/\s/g,'');															//remove spaces
	string = string.split("=").sort(function (a, b) { return b.length - a.length; })[0];		//remove tags
	string = string.replace(/[^a-zA-Z0-9+/ ]+/g, ''); 											//takes out anything that is not base64
	return string
}

nameBeingUnlocked = '';
//this function replaces an item with its value on the locDir database, decrypted if necessary, if the name exists, otherwise if gives a warning that it isn't a Lock
function replaceByItem(name,warning){
	var warningList = "";
	if(!locDir[name]) {							//not on database; strip it if it's a Lock, and otherwise add to warning list
		var stripped = striptags(name);
		if(stripped.length == 43 || stripped.length == 50){name = stripped} else {warningList = name};
	} else if(name == 'myself'){
		if(myLock) name = myLock
	} else {									//found name on DB, so get value from the database and decrypt if necessary
		var string = locDir[name][0];
		nameBeingUnlocked = name;
		var whole = keyDecrypt(string);
		nameBeingUnlocked = '';
		var	stripped = striptags(whole);
		if(stripped.length == 43 || stripped.length == 50) {name = stripped} else {name = whole};	//if it's a Lock, strip the tags
	}

	if (warningList != '' && warning){
		var agree = confirm('The following name was not found in your local directory. If you click OK, this string will be used as a shared Key for locking and unlocking the message. This could be a serious security hazard:\n\n' + warningList);
		if (!agree) throw('list encryption terminated by user')
	}
	return name
}

//changes the base of a number. inAlpha and outAlpha are strings containing the base code for the original and target bases, as in '0123456789' for decimal
//adapted from http://snippetrepo.com/snippets/bignum-base-conversion, by kybernetikos
function changeBase(number, inAlpha, outAlpha, isLock) {
	var targetBase = outAlpha.length,
		originalBase = inAlpha.length;
    var result = "";
    while (number.length > 0) {
        var remainingToConvert = "", resultDigit = 0;
        for (var position = 0; position < number.length; ++position) {
            var idx = inAlpha.indexOf(number[position]);
            if (idx < 0) {
                throw new Error('Symbol ' + number[position] + ' from the'
                    + ' original number ' + number + ' was not found in the'
                    + ' alphabet ' + inAlpha);
            }
            var currentValue = idx + resultDigit * originalBase;
            var remainDigit = Math.floor(currentValue / targetBase);
            resultDigit = currentValue % targetBase;
            if (remainingToConvert.length || remainDigit) {
                remainingToConvert += inAlpha[remainDigit];
            }
        }
        number = remainingToConvert;
        result = outAlpha[resultDigit] + result;
    }

	//add leading zeroes in Locks
	if(isLock){
		if(targetBase == 64){
			while(result.length < 43) result = 'A'+ result;
		} else if (targetBase == 36){
			while(result.length < 50) result = '0'+ result;
		}
	}
    return result;
}

//puts an 43-character random string in the 'emailBox' boxes
function randomToken(){
	var token = nacl.util.encodeBase64(nacl.randomBytes(32)).slice(0,43);
	emailIntro.value = token;
	emailBox.value = token;
}

//takes appropriate UI action if decryption fails
function failedDecrypt(){
	if(lockBox.value.slice(0,1) == '~' || isList || nameBeingUnlocked != ''){				
		any2key();					//this displays the Key entry dialog
		keyMsg.innerHTML = "<span style='color:red'>This Key won't unlock the item </span>" + nameBeingUnlocked;
		allowCancelWfullAccess = true;
	}else if(keyChange.style.display == 'block'){
		keyChange.style.display = 'none';
		keyMsg.innerHTML = "<span style='color:red'>The Old Key is wrong</span>"
	}else if (checkingKey){
		shadow.style.display = 'block';
		keyScr.style.display = 'block';
		keyMsg.innerHTML = "<span style='color:red'>Please write the last Key you used</span><br>You can change the Key in Options";
		checkingKey = false;
	}else{
		mainMsg.innerHTML = '<span>Unlock has Failed</span>';
	}
	throw('decryption failed')
}