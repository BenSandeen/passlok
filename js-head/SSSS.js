﻿//this function implements the Shamir Secret Sharing Scheme, taking the secret from the main box and putting the result back there, and vice-versa.
function secretshare(){
	var	main = XSSfilter(mainBox.innerHTML.replace(/\&nbsp;/g,'').replace(/<br>/gi,"\n").replace(/<div>/gi,"\n").replace(/<blockquote>/gi,"\n")).trim();
	if((main.slice(0,8).match(/p\d{3}/) && main.slice(0,2)=='PL') || (main.match(/\n\nA/) && main.slice(0,1)=='A')){		//main box has parts: join parts
		var shares = main.replace(/\n\s*\n/g, '\n').split("\n"),					//go from newline-containing string to array
			n = shares.length,
			quorumarr = main.match(/p\d{3}/);															//quorum in tags is "p" plus 3 digits in a row, first instance
		if(quorumarr == null) {var quorum = n} else {var quorum = parseInt(quorumarr[0].slice(1,4))};	//if tags are missing, ignore quorum, otherwise read it form tags
		if(n < quorum){																//not enough parts
			mainMsg.innerHTML = '<span style="color:red">According to the tags, you need ' + (quorum - n) + ' more parts in the box</span>'
		};
		for (var i=0; i < shares.length; i++) {
			shares[i] = bestOfThree(shares[i]);										//undo triples, if any
			shares[i] = applyRScode(shares[i],false);								//RS error correction
			shares[i] = "8" + charArray2hex(nacl.util.decodeBase64(shares[i].replace(/[^a-zA-Z0-9+/ ]+/g, '')));	//retrieve from base64 back to hex and add initial "8" to each item
		};
		if (learnMode.checked){
			var reply = confirm("The parts in the main box will be joined to retrieve the original item, which will be placed in this box. Please make sure that there are enough parts. Cancel if this is not what you want.");
			if(!reply) throw("SSSS join canceled");
		};
		if(n === 1){
			mainMsg.innerHTML = '<span style="color:red">Only one part in main box</span>';
			throw("insufficient parts")
		};
		var	sechex = secrets.combine(shares),
			secret = nacl.util.encodeUTF8(hex2charArray(sechex));
			if(XSSfilter(secret).slice(0,9) != 'filename:') secret = LZString.decompressFromBase64(secret);
		mainBox.innerHTML = secret;
		mainMsg.innerHTML = 'Join successful';
	} else {																		//parts not detected, split instead
		if (main == "") {
			mainMsg.innerHTML = '<span style="color:red">The box is empty</span>';
			throw("No key in the key box")
		};
		if (learnMode.checked){
			var reply = confirm("The item in the box will be split into several partial items, which will replace the contents of the box. A popup will ask for the total number of parts, and the minimum needed to reconstruct the original item. Cancel if this is not what you want.");
			if(!reply) throw("SSSS split canceled");
		};
		var number = partsNumber.value;
		if (number.trim() == ""){													//stop to display the entry form if it is empty
			partsIn.style.display = "block";
			shadow.style.display = "block";
			if(!isMobile) partsNumber.focus();
			throw ("stopped for # of parts input")
		}
		var quorum = partsQuorum.value;					//this value defaults to the total number if empty
		if (quorum.trim() == ""){
			quorum = number
		}
		partsNumber.value = "";							//on re-execution, read the box and reset it
		partsQuorum.value = "";
		quorum = parseInt(quorum);
		number = parseInt(number);
		if(number < 2){number = 2} else if(number > 255) {number = 255};
		if (quorum > number) quorum = number;
		var secret = mainBox.innerHTML.trim();
		if(XSSfilter(secret).slice(0,9) != 'filename:') secret = LZString.compressToBase64(secret);
		var	sechex = charArray2hex(nacl.util.decodeUTF8(secret)),
			shares = secrets.share(sechex,number,quorum);
		displayshare(shares,quorum);
		mainMsg.innerHTML = number + ' parts made. ' + quorum + ' required to reconstruct';
		partsInBox = true
	};
	partsIn.style.display = "none";
	shadow.style.display = "none"
};

function displayshare(shares,quorum){
	var length = shares[0].length,
		quorumStr = "00" + quorum;
		quorumStr = quorumStr.substr(quorumStr.length-3);

	//strip initial "8" and display each share in a new line, base 64, with tags
	if(!noTagsMode.checked){
		var dataItem = nacl.util.encodeBase64(hex2charArray(shares[0].slice(1,length))).replace(/=+/g, '')
		var	output = triple("PL22p" + quorumStr + "=" + dataItem + calcRStag(dataItem) + "=PL22p" + quorumStr);

	//trim final "=" and display with tags
	}else{
		var output = triple(nacl.util.encodeBase64(hex2charArray(shares[0].slice(1,length))).replace(/=+/g, ''))
	}
	for (var i=1; i < shares.length; i++) {
		if(!noTagsMode.checked){
			dataItem = nacl.util.encodeBase64(hex2charArray(shares[i].slice(1,length))).replace(/=+/g, '');
			output = output + "<br><br>" + triple("PL22p" + quorumStr + "=" + dataItem + calcRStag(dataItem) + "=PL22p" + quorumStr);
		}else{
			output = output + "<br><br>" + triple(nacl.util.encodeBase64(hex2charArray(shares[i].slice(1,length))).replace(/=+/g, ''))
		}
	};
	mainBox.innerHTML = output;
	smallOutput();
};