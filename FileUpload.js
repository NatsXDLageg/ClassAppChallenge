var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var parse = require('csv-parse');

var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

var users = []
var outputFile = "output.json"
var errorMessage = "";

http.createServer(function (req, res) {

	if (req.url == '/fileupload') {

	    try {
            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                if (err) {
                    errorMessage = "<p>Erro de requisição de formulário</p>";
                    throw (err);
                }
                var filePath = files.filetoupload.path;

                fs.readFile(filePath, function (err, data) {
                    if (err) {
                        errorMessage = "<p>Erro de leitura do arquivo/p>";
                        throw (err);
                    }
                    var content = data.toString();

                    parse(content, {comment: '#'}, function (err, output) {
                        if (err) {
                            errorMessage = "<p>Erro ao ler dados do arquivo. Tenha certeza de que o arquivo seja do formato .csv</p>";
                            throw (err);
                        }
                        for (var row = 1; row < output.length; row++) {
                            //The approach used here is: as the values from csv are being read, a User instance is being filled.
                            // But, if a field is of EID type and it is a duplicate, the already existing User is updated
                            var user = new User();
                            var isNewUser = true;

                            for (var col = 0; col < output[row].length; col++) {
                                var header = output[0][col];
                                var cellContent = output[row][col];

                                // FULLNAME
                                var fullnameRE = /[\t\n\r\f\v\s]*fullname/i;
                                var isFullname = fullnameRE.exec(header);
                                if (isFullname) {
                                    var fullnameValueRE = /[a-z][a-z0-9 ]*$/i;
                                    isFullname = fullnameValueRE.exec(cellContent);
                                    if (isFullname) {
                                        var fullname = cellContent.substring(isFullname.index);
                                        console.log("Fullname is " + fullname);

                                        user.UpdateFullname(fullname);
                                    }
                                }
                                else {
                                    // EID
                                    var eidRE = /[\t\n\r\f\v\s]*EID/i;
                                    var isEID = eidRE.exec(header);
                                    if (isEID) {
                                        var eidValueRE = /[0-9]+$/i;
                                        isEID = eidValueRE.exec(cellContent);
                                        if (isEID) {
                                            var eid = cellContent.substring(isEID.index);
                                            console.log("EID is " + eid);

                                            user.eid = eid;

                                            for (var i = 0; i < users.length; i++) {
                                                if (users[i].eid == user.eid) {
                                                    users[i].UpdateUserInfos(user);
                                                    user = users[i];
                                                    isNewUser = false;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        // CLASS
                                        var classRE = /[\t\n\r\f\v\s]*class/i;
                                        var isClass = classRE.exec(header);
                                        if (isClass) {
                                            var classValueRE = /[a-z][a-z0-9 ]*$/i;
                                            var possibleClasses = cellContent.split(/[,//]/);

                                            var allValidClasses = true;
                                            for (var i = 0; i < possibleClasses.length; i++) {
                                                if (!classValueRE.exec(possibleClasses[i])) {
                                                    allValidClasses = false;
                                                }
                                            }

                                            if (allValidClasses) {
                                                var classes = possibleClasses;
                                                console.log("Classes:");
                                                for (var i = 0; i < classes.length; i++) {
                                                    console.log("- " + classes[i]);
                                                }

                                                user.UpdateClasses(classes);
                                            }
                                        }
                                        else {
                                            // EMAIL
                                            var emailRE = /[\t\n\r\f\v\s]*email[\t\s]/i;
                                            var isEmail = emailRE.exec(header);
                                            if (isEmail) {
                                                var emailIndex = /email/i.exec(header).index

                                                var emailTagsValueRE = /[a-z][a-z0-9 ]*$/i;
                                                var possibleTags = header.substring(emailIndex + "email".length + 1).split(/[,//]/);

                                                var allValidTag = true;
                                                for (var i = 0; i < possibleTags.length; i++) {
                                                    if (!emailTagsValueRE.exec(possibleTags[i])) {
                                                        allValidTag = false;
                                                    }
                                                }

                                                if (allValidTag) {

                                                    // Regular expression got from http://www.zparacha.com/validate-email-address-using-javascript-regular-expression/
                                                    var emailValueRE = /[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,6}$/i;
                                                    var possibleEmails = cellContent.split(/[,//]/);

                                                    var allValidEmail = true;
                                                    for (var i = 0; i < possibleEmails.length; i++) {
                                                        if (!emailValueRE.exec(possibleEmails[i])) {
                                                            allValidEmail = false;
                                                        }
                                                    }

                                                    if (allValidEmail) {
                                                        var emails = possibleEmails;
                                                        console.log("Emails:");

                                                        var tags = []
                                                        for (var i = 0; i < possibleTags.length; i++) {
                                                            tags.push(possibleTags[i].trim());
                                                        }
                                                        var addresses = []
                                                        for (var i = 0; i < emails.length; i++) {
                                                            console.log("- " + emails[i]);

                                                            var address = new Address();
                                                            address.type = "email"
                                                            address.tags = tags;
                                                            address.address = emails[i].trim();
                                                            addresses.push(address);
                                                        }

                                                        user.UpdateAddresses(addresses);
                                                    }
                                                }
                                            }
                                            else {
                                                // PHONE
                                                var phoneRE = /[\t\n\r\f\v\s]*phone/i;
                                                var isPhone = phoneRE.exec(header);
                                                if (isPhone) {

                                                    var phoneValueRE = /[0-9\(\)\+ ]+$/i;
                                                    var isPossiblePhone = phoneValueRE.exec(cellContent);
                                                    if (isPossiblePhone) {

                                                        var phoneNumber = phoneUtil.parse(cellContent, 'BR');
                                                        var isValid = phoneUtil.isValidNumber(phoneNumber);

                                                        if (isValid) {
                                                            var phoneIndex = /phone/i.exec(header).index

                                                            var phoneTagsValueRE = /[a-z][a-z0-9 ]*$/i;
                                                            var possibleTags = header.substring(phoneIndex + "phone".length + 1).split(/[,//]/);

                                                            var allValidTag = true;
                                                            for (var i = 0; i < possibleTags.length; i++) {
                                                                if (!phoneTagsValueRE.exec(possibleTags[i])) {
                                                                    allValidTag = false;
                                                                }
                                                            }

                                                            if (allValidTag) {
                                                                var phone = phoneUtil.format(phoneNumber, PNF.E164).substring(1);
                                                                console.log("Phone is " + phone);

                                                                var tags = []
                                                                for (var i = 0; i < possibleTags.length; i++) {
                                                                    tags.push(possibleTags[i].trim());
                                                                }

                                                                var address = new Address();
                                                                address.type = "phone"
                                                                address.tags = tags;
                                                                address.address = phone.trim();

                                                                var addresses = [address];

                                                                user.UpdateAddresses(addresses);
                                                            }
                                                        }
                                                    }
                                                }
                                                else {
                                                    // INVISIBLE
                                                    var invisibleRE = /[\t\n\r\f\v\s]*invisible/i;
                                                    var isInvisible = invisibleRE.exec(header);
                                                    if (isInvisible) {
                                                        var invisibleValueRE = /^[\t\n\r\f\v\s]*(1|0)[\t\n\r\f\v\s]*$/i;
                                                        isInvisible = invisibleValueRE.exec(cellContent);

                                                        if (isInvisible) {
                                                            invisibleValueRE = /^[\t\n\r\f\v\s]*1[\t\n\r\f\v\s]*$/i;
                                                            var invisibleTrue = invisibleValueRE.exec(cellContent);

                                                            var invisible;
                                                            // Force true
                                                            if (invisibleTrue) {
                                                                invisible = true;
                                                            }
                                                            // Force false
                                                            else {
                                                                invisible = false;
                                                            }
                                                            console.log("Invisible is " + invisible);

                                                            user.invisible = invisible;
                                                        }
                                                    }
                                                    else {
                                                        //SEE_ALL
                                                        var seeAllRE = /[\t\n\r\f\v\s]*see_all/i;
                                                        var isSeeAll = seeAllRE.exec(header);
                                                        if (isSeeAll) {
                                                            var seeAllValueRE = /^[\t\n\r\f\v\s]*(yes|no)[\t\n\r\f\v\s]*$/i;
                                                            isSeeAll = seeAllValueRE.exec(cellContent);

                                                            if (isSeeAll) {
                                                                seeAllValueRE = /^[\t\n\r\f\v\s]*yes[\t\n\r\f\v\s]*$/i;
                                                                var seeAllYes = seeAllValueRE.exec(cellContent);

                                                                var seeAll;
                                                                // Force true
                                                                if (seeAllYes) {
                                                                    seeAll = true;
                                                                }
                                                                // Force false
                                                                else {
                                                                    seeAll = false;
                                                                }
                                                                console.log("SeeAll is " + seeAll);
                                                                user.see_all = seeAll;
                                                            }
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

                            if (isNewUser) {
                                users.push(user);
                            }
                        }

                        fs.writeFile('./' + outputFile, JSON.stringify(users), function (err) {
                            if (err) {
                                throw (err);
                                errorMessage = "<p>Erro ao escrever no arquivo de saída</p>";
                            }
                            fs.readFile('./pages/success.html', function (err2, data) {
                                res.writeHead(200, {'Content-Type': 'text/html'});
                                res.write(data);
                                res.end();
                            });
                        });
                    });
                });
            });
        }
        catch (err) {
            fs.readFile('./pages/error.html', function (err2, data) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                var replacedData = data.toString().replace("%content%", errorMessage);
                res.write(data);
                res.end();
            });
        }
	} else {
        fs.readFile('./pages/index.html', function(err, data) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
        });
	}
}).listen(8080);

var User = function () {
    this.fullname = "";
    this.eid = "";
    this.classes = "";
    this.addresses = [];
    this.invisible = false;
    this.see_all = false;

    this.UpdateFullname = function (fullname) {
        if(fullname != "") {
            this.fullname = fullname;
        }
    }
    this.UpdateClasses = function (classes) {
        // This approach of turning 1-sized array of classes into string was only adopted to match the results with the expected one
        if(typeof this.classes === "string") {
            console.log("STRING");
            if(this.classes == "") {
                this.classes = [];
            }
            else {
                this.classes = [this.classes];
            }
        }
        for(var i = 0; i < classes.length; i++) {
            var cl = classes[i].trim();
            if(this.classes.indexOf(cl) == -1) {
                this.classes.push(cl);
            }
        }
        if(this.classes.length == 0) {
            this.classes = "";
        }
        else if(this.classes.length == 1) {
            this.classes = this.classes[0];
        }
    }
    this.UpdateAddresses = function (addresses) {
        for(var i = 0; i < addresses.length; i++) {
            var alreadyContainsAddress = false;
            for(var j = 0; j < this.addresses.length; j++) {
                if(this.addresses[j].address == addresses[i].address) {
                    alreadyContainsAddress = true;
                    for(var k = 0; k < addresses[i].tags.length; k++) {
                        if(this.addresses[j].tags.indexOf(addresses[i].tags[k]) == -1) {
                            this.addresses[j].tags.push(addresses[i].tags[k]);
                        }
                    }
                }
            }

            if(!alreadyContainsAddress) {
                this.addresses.push(addresses[i]);
            }
        }
    }

    this.UpdateUserInfos = function (copyUser) {
        if(copyUser instanceof User && copyUser != null) {
            this.UpdateFullname(copyUser.fullname);
            this.UpdateClasses(copyUser.classes);
            this.UpdateAddresses(copyUser.addresses);
        }
        else {
            console.log("Attempted to update infos from non-user variable");
        }
    }
};

var Address = function () {
    this.type = "";
    this.tags = [];
    this.address = "";
};