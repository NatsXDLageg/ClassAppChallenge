var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var parse = require('csv-parse');

var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

var users = []

// http.createServer(function (req, res) {

	// if (req.url == '/fileupload') {
	// 	var form = new formidable.IncomingForm();
	// 	form.parse(req, function (err, fields, files) {
	// 		var oldpath = files.filetoupload.path;

            var oldpath = "./input.csv";

            fs.readFile(oldpath, function(err, data) {
                var content = data.toString();

                parse(content, {comment: '#'}, function(err, output){
                    for(var row = 1; row < output.length; row++) {
                        var user = null;
                        var isNewUser = true;

                        for(var col = 0; col < output[row].length; col++) {
                            var header = output[0][col];
                            var cellContent = output[row][col];

                            var fullnameRE = /[\t\n\r\f\v]*fullname/i;
                            var isFullname= fullnameRE.exec(header);
                            if(isFullname) {
                                var fullnameValueRE = /[a-z][a-z0-9 ]*$/i;
                                isFullname = fullnameValueRE.exec(cellContent);
                                if(isFullname) {
                                    var fullname = cellContent.substring(isFullname.index);
                                    console.log("Fullname is " + fullname);

                                    if(user == null) {
                                        user = new User();
                                    }

                                    if(user.fullname == "") {
                                        user.fullname = fullname;
                                    }
                                }
                            }
                            else {
                                var eidRE = /[\t\n\r\f\v]*EID/i;
                                var isEID = eidRE.exec(header);
                                if (isEID) {
                                    var eidValueRE = /[0-9]+$/i;
                                    isEID = eidValueRE.exec(cellContent);
                                    if(isEID) {
                                        var eid = cellContent.substring(isEID.index);
                                        console.log("EID is " + eid);

                                        for(var i = 0; i < users.length; i++) {
                                            if(users[i].eid == eid) {
                                                UpdateUserInfos(i, user);
                                            }
                                        }
                                    }
                                }
                                else {
                                    var classRE = /[\t\n\r\f\v]*class/i;
                                    var isClass = classRE.exec(header);
                                    if (isClass) {
                                        var classValueRE = /[a-z][a-z0-9 ]*$/i;
                                        var possibleClasses = cellContent.split(/[,//]/);

                                        var allValidClasses = true;
                                        for(var i = 0; i < possibleClasses.length; i++) {
                                            if(!classValueRE.exec(possibleClasses[i])) {
                                                allValidClasses = false;
                                            }
                                        }

                                        if(allValidClasses) {
                                            console.log("Classes:");
                                            for(var i = 0; i < possibleClasses.length; i++) {
                                                console.log("- " + possibleClasses[i]);
                                            }
                                        }
                                    }
                                    else {
                                        var emailRE = /[\t\n\r\f\v]*email/i;
                                        var isEmail = emailRE.exec(header);
                                        if (isEmail) {
                                            // Regular expression got from http://www.zparacha.com/validate-email-address-using-javascript-regular-expression/
                                            var emailValueRE = /[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,6}$/i;
                                            var possibleEmails = cellContent.split(/[,//]/);

                                            var allValidEmail = true;
                                            for(var i = 0; i < possibleEmails.length; i++) {
                                                if(!emailValueRE.exec(possibleEmails[i])) {
                                                    allValidEmail = false;
                                                }
                                            }

                                            if(allValidEmail) {
                                                console.log("Emails:");
                                                for(var i = 0; i < possibleEmails.length; i++) {
                                                    console.log("- " + possibleEmails[i]);
                                                }
                                            }
                                        }
                                        else {
                                            var phoneRE = /[\t\n\r\f\v]*phone/i;
                                            var isPhone = phoneRE.exec(header);
                                            if (isPhone) {

                                                var phoneValueRE = /[0-9\(\)\+ ]+$/i;
                                                var isPossiblePhone = phoneValueRE.exec(cellContent);
                                                if(isPossiblePhone) {

                                                    var phoneNumber = phoneUtil.parse(cellContent, 'BR');
                                                    var isValid = phoneUtil.isValidNumber(phoneNumber);

                                                    if(isValid) {
                                                        var phone = phoneUtil.format(phoneNumber, PNF.E164).substring(1);
                                                        console.log("Phone is " + phone);
                                                    }
                                                }
                                            }
                                            else {
                                                var invisibleRE = /[\t\n\r\f\v]*invisible/i;
                                                var isInvisible = invisibleRE.exec(header);
                                                if (isInvisible) {
                                                    var invisibleValueRE = /1$/i;
                                                    isInvisible = invisibleValueRE.exec(cellContent);

                                                    var invisible = false;
                                                    if(isInvisible) {
                                                        invisible = true;
                                                    }
                                                    console.log("Invisible is " + invisible);
                                                }
                                                else {
                                                    var seeAllRE = /[\t\n\r\f\v]*see_all/i;
                                                    var isSeeAll = seeAllRE.exec(header);
                                                    if (isSeeAll) {
                                                        var seeAllValueRE = /(yes|no)$/i;
                                                        isSeeAll = seeAllValueRE.exec(cellContent);

                                                        var seeAll = false;
                                                        if(isSeeAll && cellContent.substring(isSeeAll.index).startsWith("yes")) {
                                                            seeAll = true;
                                                        }
                                                        console.log("SeeAll is " + seeAll);
                                                    }
                                                    else {
                                                        console.log("It is nothing");
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            });

            // res.write('Finished');
            // res.end();

			// var phoneNumber = phoneUtil.parse('(17)981272289', 'BR');
            // var isValid = phoneUtil.isValidNumber(phoneNumber);
			// console.log(isValid);
			// if(isValid) {
             //    var phone = phoneUtil.format(phoneNumber, PNF.E164).substring(1);
             //    console.log(phone);
            // }
			//
            //
			// var newpath = 'C:/Users/natha/' + files.filetoupload.name;
			// fs.rename(oldpath, newpath, function (err) {
			// 	if (err) throw err;
			// 	res.write('File uploaded and moved!');
			// 	res.end();
			// });
        // });
	// } else {
	// 	res.writeHead(200, {'Content-Type': 'text/html'});
	// 	res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
	// 	res.write('<input type="file" name="filetoupload"><br>');
	// 	res.write('<input type="submit">');
	// 	res.write('</form>');
	// 	return res.end();
	// }
// }).listen(8080);

var User = function () {
    this.fullname = "";
    this.eid = "";
    this.classes = [];
    this.addresses = [];
    this.invisible = false;
    this.see_all = false;
};

var Address = function () {
    this.type = "";
    this.tags = [];
    this.address = "";
};

function UpdateUserInfos(index, copyUser) {

};