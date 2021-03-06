﻿//this is for showing and hiding text in key box and other password input boxes
function showsec(){
	if(showKey.checked){
		pwd.type="TEXT";
	}else{
		pwd.type="PASSWORD";
	}
};

function showDecoyIn(){
	if(showDecoyInCheck.checked){
		decoyPwdIn.type="TEXT";
	}else{
		decoyPwdIn.type="PASSWORD";
	}
};

function showDecoyOut(){
	if(showDecoyOutCheck.checked){
		decoyPwdOut.type="TEXT";
	}else{
		decoyPwdOut.type="PASSWORD";
	}
};

function showIntro(){
	if(showIntroKey.checked){
		pwdIntro.type="TEXT";
	}else{
		pwdIntro.type="PASSWORD";
	}
};

function showNewKey(){
	if(showNewKeyCheck.checked){
		newKey.type="TEXT";
		newKey2.type="TEXT";
	}else{
		newKey.type="PASSWORD";
		newKey2.type="PASSWORD";
	}
};

//to display output in a small font
function smallOutput(){
	if(smallOutMode.checked) mainBox.innerHTML = "<span style='color:black;background-color:white;font-size:xx-small'>" + XSSfilter(mainBox.innerHTML) + "</span>";
}

function box2cover(){
	newcover(XSSfilter(mainBox.innerHTML.replace(/\&nbsp;/g,' ').trim()))
}

function chat2main(){
	chatScr.style.display = 'none'
}

function resetChat(){
	var frame = document.getElementById('chatFrame');
	var src = frame.src;
	frame.src = '';
	setTimeout(function(){frame.src = src;}, 0);
}

//for clearing different boxes
function clearMain(){
	mainBox.innerHTML = '';
	mainMsg.innerHTML = '';
	detectLock = true;
}
function clearLocks(){
	lockBox.value='';
	lockNameBox.value='';
	lockMsg.innerHTML='';
	suspendFindLock = false;
}
function clearIntro(){
	pwdIntro.value = '';
	introMsg.innerHTML = '';
	pwd.value = '';
	keyMsg.innerHTML = '';
}
function clearIntroEmail(){
	emailIntro.value = '';
}

//for selecting the Main box contents
function selectMain(){
    var range, selection;   
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(mainBox);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();        
        range = document.createRange();
        range.selectNodeContents(mainBox);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

//writes five random dictionary words in the intro Key box
function suggestIntro(){
	var output = '';
	for(var i = 1; i <=5 ; i++){
		var rand = wordlist[Math.floor(Math.random()*wordlist.length)];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand;
	}
	pwdIntro.type="TEXT";
	pwdIntro.value = output.trim();
	showIntroKey.checked = true
}

//makes a new user account
function newUser(){
	introscr.style.display = "block";
	BasicButtons = true;
}

//shows email screen so email/token can be changed
function showEmail(){
	if(myEmail) emailBox.value = myEmail;
	shadow.style.display = 'block';
	emailScr.style.display = 'block';
}

//shows user name so it can be changed
function showName(){
	userNameBox.value = userName;
	shadow.style.display = 'block';
	nameScr.style.display = 'block'	
}

//changes the name of the complete database, syncs if possible
function changeName(){
	if(!fullAccess){
		namechangemsg.innerHTML = 'Name change not allowed after Key cancel';
		throw('Name change canceled')
	}
	if (learnMode.checked){
		var reply = confirm("The current User Name will be changed. Cancel if this is not what you want.");
		if(!reply) throw("Name change canceled");
	}
	var oldUserName = userName,
		userNameTemp = document.getElementById('userNameBox').value,
		key = readKey();
	if (userNameTemp.trim() == ''){
		throw('no name');
	}
	recryptDB(key,userNameTemp);
	localStorage[userNameTemp] = localStorage[userName];
	delete localStorage[userName];
	userName = userNameTemp;
	
	if(ChromeSyncOn){
		for(var name in locDir){
			syncChromeLock(name,JSON.stringify(locDir[name]));
			chrome.storage.sync.remove((oldUserName+'.'+name).toLowerCase());
		}
		updateChromeSyncList();
		chrome.storage.sync.remove(oldUserName.toLowerCase()+'.ChromeSyncList');
	}
}

//makes base64 code for checkboxes in Options and stores it
function checkboxStore(){
	if(fullAccess){
		var checks = document.optionchecks;
		var binCode = '', i;
		for(i = 0; i < checks.length; i++){
			binCode += checks[i].checked ? 1 : 0;
		}
		if(locDir['myself']){
			locDir['myself'][3] = changeBase(binCode,'01',BASE64);
			localStorage[userName] = JSON.stringify(locDir);
		
			if(ChromeSyncOn){
				syncChromeLock('myself',JSON.stringify(locDir['myself']));
			}
		}
	}
}

//resets checkboxes in Options according to the stored code
function code2checkbox(){
	var checks = document.optionchecks;
	if(locDir['myself'][3]){
		var binCode = changeBase(locDir['myself'][3],BASE64,'01'), i;
		while(binCode.length < checks.length) binCode = '0' + binCode;
		for(i = 0; i < checks.length; i++){
			checks[i].checked = (binCode[i] == '1')
		}
		BasicButtons = checks[0].checked;
	}
	if(!BasicButtons){												//retrieve Advanced interface
		openClose("basicBtnsTop");
		openClose("mainBtnsTop");
		openClose("basicLockBtnsTop");
		openClose("advLockModes");
		openClose("lockBtnsTop");
		openClose("lockBtnsBottom");
		openClose('advancedModes');
		openClose('advancedBtns');
		openClose('advancedHelp');
		basicMode.checked = false;
		advancedMode.checked = true;
	}
}

//go to 2nd intro screen, and back. The others are similar
function go2intro2(){
	openClose('introscr');
	openClose('introscr2');
}
function go2intro3(){
	openClose('introscr2');
	openClose('introscr3');
}
function go2intro4(){
	openClose('introscr3');
	openClose('introscr4');
}
function go2intro5(){
	intromsg2.innerHTML = '';
	openClose('introscr4');
	openClose('introscr5');
}

//these close input dialogs
function closeBox() {
	shadow.style.display = "none";
	keyScr.style.display = "none";
	lockScr.style.display = "none";
	decoyIn.style.display = "none";
	decoyOut.style.display = "none";
	partsIn.style.display = "none";
	keyChange.style.display = "none";
	emailScr.style.display = "none";
	chatDialog.style.display = "none";
	nameScr.style.display = "none";
	introscr.style.display = "none";
}

//Key entry is canceled, so record the limited access mode and otherwise start normally
function cancelKey(){
	if(firstInit) pwd.value = '';
	if(!allowCancelWfullAccess){
		fullAccess = false;
		
		if (nameList.options.length == 2){						//only one user, no need to select it
			userName = nameList.options[1].value
		}else{												//several users
			for (var i = 0; i < nameList.options.length; i++) {
    			if(nameList.options[i].selected){
					userName = nameList.options[i].value
    			}
  			}
		}

		getSettings();
		fillList();										//put names in selection box
		if(locDir['myself']){
			locDir['myself'][4] = 'guest mode';
			localStorage[userName] = JSON.stringify(locDir);
		
			if(ChromeSyncOn){
				syncChromeLock('myself',JSON.stringify(locDir['myself']));
			}			
		}
		if(Object.keys(locDir).length == 1 || Object.keys(locDir).length == 0){		//new user, so display a fuller message
			mainMsg.innerHTML = 'To lock a message for someone, you must first enter the recipient’s Lock or shared Key by clicking the <strong>Edit</strong> button'
		}else{
			mainMsg.innerHTML = 'You are in Guest mode<br>For full access, reload and enter the Key'
		}
	}
	allowCancelWfullAccess = false;
	closeBox()
}
function cancelName(){
	closeBox();
	callKey = ''
}
function cancelEmail(){
	emailBox.value = '';
	closeBox();
	callKey = ''
}
function cancelDecoyIn(){
	decoyPwdIn.value = '';
	closeBox()
}
function cancelDecoyOut(){
	decoyPwdOut.value = '';
	closeBox()
}
function cancelPartsIn(){
	partsNumber.value = '';
	closeBox()
}
function cancelChat(){
	closeBox()
}
function cancelKeyChange(){
	newKey.value = '';
	closeBox();
	if(keyScr.style.display == 'block') keyScr.style.display = 'none';
	callKey = ''
}
function hide5min(){
	if(neverMode.checked){
		fiveMin.style.display = "none"
	}else{
		fiveMin.style.display = "block"
	}
}

//triggered if the user types Enter in the name box of the locks screen
function lockNameKeyup(evt){
	evt = evt || window.event												//IE6 compliance
	if (evt.keyCode == 13) {												//sync from Chrome or decrypt if hit Return
		if(lockMsg.innerHTML == ''){				//found nothing, so try to get it from Chrome sync
			if(ChromeSyncOn){
				getChromeLock(lockNameBox.value);
			}
		} else {												//decrypt 1st time if found locally, 2nd time if synced from Chrome
			if(!lockMsg.innerHTML.match('not found in your Chrome')){
				var firstchar = lockBox.value.slice(0,1);
				if(firstchar == '~'){
					decryptLock()
				}
			}
		}
	} else if (!suspendFindLock){											//otherwise search database
			return findLock()
	} else {
		if(lockBox.value.trim() == ''){
			suspendFindLock = false;
			return findLock()
		}
	}
}

//displays Keys strength and resets Key timer
function pwdKeyup(evt){
	clearTimeout(keytimer);
	keytimer = setTimeout(function() {pwd.value = ''}, 300000);
	keytime = new Date().getTime();
	evt = evt || window.event
	if (evt.keyCode == 13){acceptKey()} else{
		 return keyStrength(pwd.value,true);
	}
}

//Key strength display on intro screen
function introKeyup(){
	return keyStrength(pwdIntro.value,true);
}

//same but for decoy In screen
function decoyKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){submitDecoyIn()} else{
		 return keyStrength(decoyPwdIn.value,true);
	}
}

//same for key Change screen
function newKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){changeKey()} else{
		 return keyStrength(newKey.value,true);
	}
}

//this one looks at the second box and announces a match
function newKey2up(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){changeKey()} else {
		var	newkey = newKey.value,
			newkey2 = newKey2.value,
			length = newkey.length,
			length2 = newkey2.length;
		if(length != length2){
			if(newkey2 == newkey.slice(0,length2)){
				keyChangeMsg.innerHTML = 'Keys match so far. ' + (length - length2) + ' characters to go'
			} else {
				keyChangeMsg.innerHTML = "<span style='color:magenta'>Keys don't match</span>"
			}
		}else{
			if(newkey2 == newkey){
				keyChangeMsg.innerHTML = "<span style='color:green'>Keys match!</span>"
			} else {
				keyChangeMsg.innerHTML = "<span style='color:magenta'>Keys don't match</span>"
			}
		}
	}
}

//activated when the user clicks OK on a decoy screen
function submitDecoyIn(){
	closeBox();
	lockUnlock()
}

//Enter has the same effect as clicking OK in decoy and parts box
function decoyKeyupOut(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){submitDecoyOut()};
}
function submitDecoyOut(){
	closeBox();
	lockUnlock()
}
function partsKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){submitParts()};
}
function submitParts(){
	if(!isNaN(partsNumber.value)){
	closeBox();
	secretshare();
	}
}
function emailKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){email2any()};
}
function nameKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){name2any()};
}

//for switching between sets of buttons
function main2extra(){
	if(basicMode.checked) return;
	openClose("mainBtnsTop");
	openClose("extraButtonsTop");
	fillList();
}

//switch to Advanced mode
function basic2adv(){
	mainBtnsTop.style.display = 'block';
	basicBtnsTop.style.display = 'none'
	lockBtnsTop.style.display = 'block';
	basicLockBtnsTop.style.display = 'none';
	lockBtnsBottom.style.display = 'block';
	advLockModes.style.display = 'block';
	advancedModes.style.display = 'block';
	advancedBtns.style.display = 'block';
	advancedHelp.style.display = 'block';
	basicMode.checked = false;
	advancedMode.checked = true;

	BasicButtons = false;
	checkboxStore()
}

//switch to Basic mode
function adv2basic(){
	mainBtnsTop.style.display = 'none';
	extraButtonsTop.style.display = 'none';
	basicBtnsTop.style.display = 'block'
	lockBtnsTop.style.display = 'none';
	basicLockBtnsTop.style.display = 'block';
	lockBtnsBottom.style.display = 'none';
	advLockModes.style.display = 'none';
	advancedModes.style.display = 'none';
	advancedBtns.style.display = 'none';
	advancedHelp.style.display = 'none';
	basicMode.checked = true;
	advancedMode.checked = false;

	BasicButtons = true;	
	checkboxStore();
	fillList()
}

//opens local directory for input if something seems to be missing
function main2lock(){
	if(tabLinks['mainTab'].className == '') return;
	openClose('lockScr');
	openClose('shadow');
	if(Object.keys(locDir).length == 1 || Object.keys(locDir).length == 0){				//new user, so display a fuller message
		lockMsg.innerHTML = 'Please enter a Lock or shared Key in the lower box. To store it, write a name in the top box and click <strong>Save</strong>.'
	}
	var string = lockBox.value;
	if(string.length > 500){							//cover text detected, so replace the currently selected one
		newcover(string);
	}
}

//open image screen
function main2image(){
	if (learnMode.checked){
		var reply = confirm("A new screen will open so you can load an image and hide the contents of the box in it. This only works for valid PassLok output. Cancel if this is not what you want.");
		if(!reply) throw("Image canceled");
	};
	openClose('imageScr');
	if(document.getElementById('preview').src.slice(0,4)!='data'){
		imagemsg.innerHTML='Click the button above to load an image'
	}else{
		updateCapacity()
	}
};

//return from image screen
function image2main(){
	if(imageScr.style.display=='block'){
		openClose('imageScr');
	}
}

//go to general directory frame
function lock2dir(){
	if (learnMode.checked){
		var reply = confirm("The General Directory will open so you can find or post a Lock.\nWARNING: this involves going online, which might leak metadata. Cancel if this is not what you want.");
		if(!reply) throw("General Directory canceled");
	};
	if(keyScr.style.display=='block') return;
	if(lockdirScr.style.display=='none') loadLockDir();
	var locklength = striptags(XSSfilter(mainBox.innerHTML.replace(/\&nbsp;/g,''))).length;
	if ((locklength == 43 || locklength == 50) && lockdirScr.style.display != "block"){

//if populated, send Lock to directory
		var frame = document.getElementById('lockdirFrame');
		frame.contentWindow.postMessage(XSSfilter(mainBox.innerHTML.replace(/\&nbsp;/g,'')), 'https://www.passlok.com');
		frame.onload = function() {
	    	frame.contentWindow.postMessage(XSSfilter(mainBox.innerHTML.replace(/\&nbsp;/g,'')), 'https://www.passlok.com');		//so that the Lock directory gets the Lock, too
		};
		lockdirScr.style.display = "block";
		return
	}
	openClose('lockdirScr');
	focusBox()
}

//return from general directory frame
function dir2any(){
	openClose('lockdirScr');
	focusBox()
}

//to load general Lock directory only once
function loadLockDir(){
	if(document.getElementById('lockdirFrame').src != 'https://www.passlok.com/lockdir') document.getElementById('lockdirFrame').src = 'https://www.passlok.com/lockdir';
}

//loads the chat frame
function main2chat(token){
	if(isAndroid){
		var reply = confirm('On Android, the chat function works from a browser page, but not yet from the app. Please cancel if you are running PassLok as a native app.');
		if(!reply) throw('chat canceled by user');
	}
	document.getElementById('chatFrame').src = 'https://www.passlok.com/chat/index.html#' + token;
	chatScr.style.display = 'block';
}

//called when the Key box is empty
function any2key(){
	closeBox();
	shadow.style.display = 'block';
	keyScr.style.display = 'block';
	if(!isMobile) pwd.focus();
	allowCancelWfullAccess = false
}

//called when the email box is empty
function any2email(){
	shadow.style.display = 'block';
	emailScr.style.display = 'block';
	emailMsg.innerHTML = 'Please enter your new email or similar item, or a new random token';
	if(!isMobile) emailBox.focus()
}

//close screens and reset Key timer when leaving the Key box. Restarts whatever was being done when the Key was found missing.
function key2any(){
	clearTimeout(keytimer);
	keytimer = setTimeout(function() {pwd.value = ''}, 300000)	//reset timer for 5 minutes, then delete Key
	keytime = new Date().getTime();
	keyScr.style.display = 'none';
	shadow.style.display = 'none';
}

//leave email screen
function email2any(){
	if(callKey = 'showlock') var dispLock = true;				//in case we were in the middle of displaying the Lock
	callKey = 'changeemail';
	var email = emailBox.value.trim();
	if(myEmail.length == 43 && fullAccess){
		var result = confirm('If you go ahead, the random token associated with your user name will be overwritten, which will change your Lock. This is irreversible.');
		if(!result){
			emailMsg.innerHTML = 'Random token overwrite canceled';
			throw ('random token overwrite canceled')
		}
	}
	myEmail = email;
	emailBox.value = '';
	var	key = readKey();
	if(!KeyDir) KeyDir = wiseHash(key,userName);
	KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,myEmail)).secretKey;			//do this regardless in case email has changed
	KeyDH = ed2curve.convertSecretKey(KeySgn);
	myLock = nacl.util.encodeBase64(nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey).replace(/=+$/,'');
	myezLock = changeBase(myLock, BASE64, BASE36, true);
	if(dispLock) lockDisplay();
	
	if(fullAccess){
		for(var name in locDir){					//this has likely changed for each entry, so delete it. It will be remade later
			delete locDir[name][1];
			
			if(ChromeSyncOn) syncChromeLock(name,JSON.stringify(locDir[name]))
		}
		storemyLock();										//this also stores the email		
	}
	emailScr.style.display = 'none';
	key2any();															//close key dialog too, if it was open
	if(tabLinks['optionsTab'].className == 'selected') optionMsg.innerHTML = '<span style="color:green">Email/token changed</span>';
	callKey = ''
}

//leave name change screen
function name2any(){
	callKey = 'changename';
	if(fullAccess){
		changeName()
	}else{
		namechangemsg.innerHTML = 'Name change not allowed after Key cancel';
		throw('Name change canceled')
	}
	closeBox();
	optionMsg.innerHTML = '<span style="color:green">The User Name has changed to: '+ userName +'</span>';
	callKey = ''
}

//put cursor in the box. Handy when using keyboard shortcuts
function focusBox(){
	if (!isMobile){															//on mobile, don't focus
		if(keyScr.style.display == 'block'){
			pwd.focus()
		} else if(lockScr.style.display == 'block'){
			lockNameBox.focus()
		} else {
			mainBox.focus()
		}
	}
}

//simple XSS filter for use in innerHTML-editing statements. Removes stuff between angle brackets
function XSSfilter(string){
	return string.replace(/<(.*?)>/gi, "")
}

<!-- Text hide trick, by Sandeep Gangadharan 2005-->
if (document.getElementById) {
 document.writeln('<style type="text/css"><!--')
 document.writeln('.texter {display:none} @media print {.texter {display:block;}}')
 document.writeln('//--></style>') }

function openClose(theID) {
 if (document.getElementById(theID).style.display === "block") { document.getElementById(theID).style.display = "none" }
 else { document.getElementById(theID).style.display = "block" } };
// end of hide trick

<!--variables and functions for making tabs, by Matt Doyle 2009-->
    var tabLinks = new Array();
    var contentDivs = new Array();

    function initTabs() {

      // Grab the tab links and content divs from the page
      var tabListItems = document.getElementById('tabs').childNodes;
      for ( var i = 0; i < tabListItems.length; i++ ) {
        if ( tabListItems[i].nodeName == "LI" ) {
          var tabLink = getFirstChildWithTagName( tabListItems[i], 'A' );
          var id = getHash( tabLink.getAttribute('href') );
          tabLinks[id] = tabLink;
          contentDivs[id] = document.getElementById(id);
        }
      }

      // Assign onclick events to the tab links, and
      // highlight the first tab
      var i = 0;

      for ( var id in tabLinks ) {
        tabLinks[id].onclick = showTab;
        tabLinks[id].onfocus = function() { this.blur() };
        if ( i == 0 ) tabLinks[id].className = 'selected';
        i++;
      }

      // Hide all content divs except the first
      var i = 0;

      for ( var id in contentDivs ) {
        if ( i != 0 ) contentDivs[id].className = 'tabContent hide';
        i++;
      }
    }

    function showTab() {
      var selectedId = getHash( this.getAttribute('href') );

      // Highlight the selected tab, and dim all others.
      // Also show the selected content div, and hide all others.
      for ( var id in contentDivs ) {
        if ( id == selectedId ) {
          tabLinks[id].className = 'selected';
          contentDivs[id].className = 'tabContent';
        } else {
          tabLinks[id].className = '';
          contentDivs[id].className = 'tabContent hide';
        }
      }

      // Stop the browser following the link
      return false;
    }

    function getFirstChildWithTagName( element, tagName ) {
      for ( var i = 0; i < element.childNodes.length; i++ ) {
        if ( element.childNodes[i].nodeName == tagName ) return element.childNodes[i];
      }
    }

    function getHash( url ) {
      var hashPos = url.lastIndexOf ( '#' );
      return url.substring( hashPos + 1 );
    }
//end of tab functions

//function to search in Help tab, from JAVASCRIPTER.NET 2011
var TRange=null;

function findString (str) {
 if (parseInt(navigator.appVersion)<4) return;
 var strFound;
 if (window.find) {

  // CODE FOR BROWSERS THAT SUPPORT window.find

  strFound=self.find(str);
  if (!strFound) {
   strFound=self.find(str,0,1);
   while (self.find(str,0,1)) continue;
  }
 }
 else if (navigator.appName.indexOf("Microsoft")!=-1) {

  // EXPLORER-SPECIFIC CODE

  if (TRange!=null) {
   TRange.collapse(false);
   strFound=TRange.findText(str);
   if (strFound) TRange.select();
  }
  if (TRange==null || strFound==0) {
   TRange=self.document.body.createTextRange();
   strFound=TRange.findText(str);
   if (strFound) TRange.select();
  }
 }
 else if (navigator.appName=="Opera") {
  alert ("Opera browsers not supported, sorry...")
  return;
 }
 if (!strFound){
	 helpmsg.innerHTML = 'Text not found in the titles'
 }else{
	 helpmsg.innerHTML = 'Text highlighted below. Click again to see more results'
 }
 return;
}

//for rich text editing
function formatDoc(sCmd, sValue) {
	  document.execCommand(sCmd, false, sValue); mainBox.focus(); 
}

var niceEditor = false;
//function to toggle rich text editing on mainBox
function toggleRichText() {
	if(niceEditor) {
		toolBar1.style.display = 'none';
		niceEditBtn.innerHTML = 'Rich';
		niceEditor = false
	} else {
		toolBar1.style.display = 'block';
		niceEditBtn.innerHTML = 'Plain';
		niceEditor = true
	}
	textheight();
}
//The main script in the head ends here.