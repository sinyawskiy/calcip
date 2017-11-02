if(typeof(Calcip) === 'undefined'){Calcip={};}
if(typeof(Calcip.T) === 'undefined'){Calcip.T={};}
if(typeof(Calcip.Exp) === 'undefined'){Calcip.Exp={};}
Calcip.Exp.ip = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/i;
Calcip.Exp.cidr = /^([0-9]|2[0-9]|1[0-9]|3[0-2])$/i;
Calcip.Exp.netmask = /^((128|192|224|240|248|252|254)\.0\.0\.0)|(255\.(((0|128|192|224|240|248|252|254)\.0\.0)|(255\.(((0|128|192|224|240|248|252|254)\.0)|255\.(0|128|192|224|240|248|252|254)))))$/i;
Calcip.Exp.comma = /,/i;
Calcip.clipboards = [];
Calcip.neighbours = [];

Calcip.T.resultTable =
    '<table id="table_result" class="table table-hover table-condensed">' +
        '<tbody>' +
        '<thead>' +
            '<tr><th>Параметр</th><th>Значение</th><th>Hex</th><th>Bin</th><th>Int</th></tr>' +
        '</thead>' +
        '<% for(var i in result){ %>' +
            '<% if(result[i].length==2){ %>' +
                '<tr><td><%= result[i][0] %></td><td class="c1" colspan="4"><%= result[i][1] %></td></tr>' +
            '<% }else{ %>'+
                '<tr><td><%= result[i][0] %></td><td class="c1"><%= result[i][1] %></td><td class="c2"><%= result[i][2] %></td><td class="c3"><%= result[i][3] %></td><td class="c4"><%= result[i][4] %></td></tr>' +
            '<% } %>' +
        '<% } %>' +
        '</tbody>' +
    '</table>';

Calcip.T.resultMacTable =
    '<table class="table table-hover table-condensed mac_result">' +
        '<tbody>' +
        '<thead>' +
            '<tr><th>Параметр</th><th>Значение</th></tr>' +
        '</thead>' +
        '<tr><td>MAC адрес</td><td class="c2"><%= result[0] %></td></tr>' +
        '<tr><td>GNU Linux</td><td class="c1">ifconfig eth0 hw ether <%= result[1] %> &&<br> echo hwaddress ether <%= result[1] %> &gt;&gt; &frasl;etc&frasl;network&frasl;interfaces</td></tr>' +
        '<tr><td>FreeBSD</td><td class="c1">ifconfig re0 ether <%= result[1] %></td></tr>' +
        '</tbody>' +
    '</table>';

Calcip.calculate = function(ip_address, cidr){ // result = [Attr, value, HEX, BIN, INT]
    var ipArr = Calcip.Utils.calcNetworkIp(ip_address, cidr),
        broadcastArr = ipArr,
        minIpArr = ipArr,
        maxIpArr = ipArr,
        maskArr=Calcip.Utils.calcNetworkMask(cidr),
        inverseMaskArr = Calcip.Utils.calcNetworkInverseMask(cidr),
        hostCount = Calcip.Utils.calcHostCount(cidr),
        hostCountText = cidr!=32?(hostCount + ' - 2 = ' + (hostCount - 2)):'хост',
        netClass=Calcip.Utils.calcNetworkClass(cidr);

    if(netClass.length){
        netClass=' (<abbr title="Сеть класса '+netClass+'">'+netClass+'</abbr>)';
    }

    if(cidr<32){
        broadcastArr = Calcip.Utils.calcBroadcastIp(ipArr.join('.'), cidr);
        minIpArr = cidr<31?Calcip.Utils.calcMinIp(ipArr, cidr):ipArr;
        maxIpArr = cidr<31?Calcip.Utils.calcMaxIp(broadcastArr, cidr):broadcastArr;
    }

    return [
        ['IP сети', ipArr.join('.'), Calcip.Utils.calcIpHexViewStrFromInt(Calcip.Utils.setIpFromStrToInt(ipArr.join('.'))), Calcip.Utils.calcIpBinViewStrFromInt(Calcip.Utils.setIpFromStrToInt(ipArr.join('.')), cidr), Calcip.Utils.setIpFromStrToInt(ipArr.join('.'))],
        ['Маска ' + netClass, maskArr.join('.'), Calcip.Utils.calcIpHexViewStrFromInt(Calcip.Utils.setIpFromStrToInt(maskArr.join('.'))), Calcip.Utils.calcIpBinViewStrFromInt(Calcip.Utils.setIpFromStrToInt(maskArr.join('.')), cidr), Calcip.Utils.setIpFromStrToInt(maskArr.join('.'))],
        ['Инв. маска', inverseMaskArr.join('.'), Calcip.Utils.calcIpHexViewStrFromInt(Calcip.Utils.setIpFromStrToInt(inverseMaskArr.join('.'))), Calcip.Utils.calcIpBinViewStrFromInt(Calcip.Utils.setIpFromStrToInt(inverseMaskArr.join('.')), cidr), Calcip.Utils.setIpFromStrToInt(inverseMaskArr.join('.'))],
        ['Мин. IP', minIpArr.join('.'), Calcip.Utils.calcIpHexViewStrFromInt(Calcip.Utils.setIpFromStrToInt(minIpArr.join('.'))), Calcip.Utils.calcIpBinViewStrFromInt(Calcip.Utils.setIpFromStrToInt(minIpArr.join('.')), cidr), Calcip.Utils.setIpFromStrToInt(minIpArr.join('.'))],
        ['Макс. IP', maxIpArr.join('.'), Calcip.Utils.calcIpHexViewStrFromInt(Calcip.Utils.setIpFromStrToInt(maxIpArr.join('.'))), Calcip.Utils.calcIpBinViewStrFromInt(Calcip.Utils.setIpFromStrToInt(maxIpArr.join('.')), cidr), Calcip.Utils.setIpFromStrToInt(maxIpArr.join('.'))],
        ['Широковещ.', broadcastArr.join('.'), Calcip.Utils.calcIpHexViewStrFromInt(Calcip.Utils.setIpFromStrToInt(broadcastArr.join('.'))), Calcip.Utils.calcIpBinViewStrFromInt(Calcip.Utils.setIpFromStrToInt(broadcastArr.join('.')), cidr), Calcip.Utils.setIpFromStrToInt(broadcastArr.join('.'))],
        ['Конфиг.', 'ip address ' + ipArr.join('.') + ' ' + maskArr.join('.')],
        ['BGP сеть', 'network ' + ipArr.join('.') + ' mask ' + maskArr.join('.')],
        ['OSFP сеть', 'network ' + ipArr.join('.') + ' ' + inverseMaskArr.join('.') + ' area'],
        ['Кол.хостов', hostCountText]
    ];
};

Calcip.createSalt = function(len){
        var saltAlpha = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz./-+_",
            salt = '$1$';
        for(var i = 0; i < len; ++i) {
            salt += saltAlpha.charAt(Math.floor(Math.random() * saltAlpha.length));
        }
        return salt;
};

Calcip.password = {};
Calcip.password.phonetic_alpha = {
    'a':'alpha', 'b':'bravo' , 'c':'charlie', 'd':'delta', 'e':'echo', 'f':'foxtrot', 'g':'golf', 'h': 'hotel', 'i': 'italy', 'j': 'juliette', 'k':'kilo', 'l':'lima', 'm':'mike', 'n':'nancy', 'o':'oscar', 'p':'papa', 'q':'quebec', 'r':'romeo', 's':'sierra', 't':'tango', 'u':'uniform', 'v':'victor', 'w':'whiskey', 'x':'x-ray','y':'yankee', 'z':'zulu',
    'а':'анна', 'б':'борис', 'в':'василий', 'г':'галина', 'д':'дмитрий', 'е':'елена', 'ё':'ёж', 'ж':'женя', 'з':'зинаида', 'и':'иван', 'й':'йот', 'к':'константин', 'л':'леонид', 'м':'мария', 'н':'николай', 'о':'ольга', 'п':'павел', 'р':'радио', 'с':'семён', 'т':'татьяна', 'у':'ульяна', 'ф':'фёдор', 'х':'харитон', 'ц':'центр', 'ч':'человек', 'ш':'шура', 'щ':'щука', 'ъ':'твердый знак', 'ы':'эры', 'ь':'икс','э':'эмма','ю':'юрий', 'я':'яков'
};
Calcip.password.littera_vocale = 'aeiouyаеёиоуыэюя';
Calcip.password.latin = 'abcdefghijklmnopqrstuvwxyz';
Calcip.password.cyrillic = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
Calcip.password.digits = '0123456789';
Calcip.password.punctiation = '#$!"%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
Calcip.password.similar = '0oil1йиоеёьъ\'`"';
Calcip.password.passwords = [];
Calcip.password.replaceBoth = 'eеEЕTТBВyуXХхx';

Calcip.password.createAlpha = function(digits, punctuation, lowercase, cyrillic, similar){
    var result = [Calcip.password.latin], alpha='', i=0;
    if(cyrillic){
        result.push(Calcip.password.cyrillic);
    }
    if(!lowercase){
        result.push(Calcip.password.latin.toUpperCase());
        if(cyrillic){
            result.push(Calcip.password.cyrillic.toUpperCase());
        }
    }

    if(digits){
        result.push(Calcip.password.digits);
    }
    if(punctuation){
        result.push(Calcip.password.punctiation);
    }
    alpha = result.join('');
    if(similar){
        for(i=0;i<Calcip.password.similar.length;i++){
            alpha = alpha.replace(Calcip.password.similar.charAt(i), '').replace(Calcip.password.similar.charAt(i).toUpperCase(), '');
        }
    }
    if(cyrillic){
        for(i=0;i<Calcip.password.replaceBoth.length;i++){
            alpha = alpha.replace(Calcip.password.replaceBoth.charAt(i), '');
        }
    }
    return alpha;
};

Calcip.password.isLitteraVocale = function(littera){
    var i=0;
    for(i=0;i<Calcip.password.littera_vocale.length;i++){
        if(littera.toLowerCase() == Calcip.password.littera_vocale.charAt(i)){
            return true;
        }
    }
    return false;
};

Calcip.password.getRandomChar = function(alpha){
    return alpha.charAt(Math.floor(Math.random() * alpha.length));
};

Calcip.password.getLitteras = function(alpha){
    var litteras = '', i, k, found=false;
    for(k=0;k<alpha.length;k++){
        found=false;
        for(i=0;i<Calcip.password.littera_vocale.length;i++){
            if(alpha.charAt(k).toLowerCase() == Calcip.password.littera_vocale.charAt(i)){
                found= true;
            }
        }
        if(found){
            litteras+=alpha.charAt(k);
        }
    }
    return litteras;
};

Calcip.password.getNoLitteras = function(alpha, litteras){
    var noLitteras = alpha, i;
    for(i=0;i<litteras.length;i++){
        noLitteras = noLitteras.replace(litteras.charAt(i), '').replace(litteras.charAt(i).toUpperCase(), '');
    }
    return noLitteras;
};


Calcip.password.getChars = function(alpha){
    var chars = '', i, k, not_found=true;
    for(k=0;k<alpha.length;k++){
        not_found = true;
        for(i=0;i<Calcip.password.digits.length;i++){
            if(alpha.charAt(k) == Calcip.password.digits.charAt(i)){
                not_found = false;
                break;
            }
        }
        if(not_found){
            chars+=alpha.charAt(k);
        }
    }
    return chars;
};


Calcip.password.getDigits = function(alpha){
    var digits = '', i, k, found=false;
    for(k=0;k<alpha.length;k++){
        found = false;
        for(i=0;i<Calcip.password.digits.length;i++){
            if(alpha.charAt(k) == Calcip.password.digits.charAt(i)){
                found=true;
                break;
            }
        }
        if(found){
            digits+=alpha.charAt(k);
        }
    }
    return digits;
};

Calcip.password.createPhoneticWord = function(letter){
    var word = Calcip.password.phonetic_alpha[letter];

    if(!word){
        word = Calcip.password.phonetic_alpha[letter.toLowerCase()];
        if(word){
            word = word.toUpperCase();
        }
    }
    return word||letter;
};

Calcip.password.createPhoneticString = function(password){
    var phonetic = [],i;
    for(i=0;i<password.length;i++){
        phonetic.push(Calcip.password.createPhoneticWord(password.charAt(i)));
    }
    return phonetic.join(' ');
};

Calcip.password.createPassword = function(alpha, password_length){
    var password = '';
    for(i=0;i<password_length;i++){
        password += Calcip.password.getRandomChar(alpha);
    }
    return password;
};

Calcip.password.createSimplePassword = function(alpha, password_length, number_length, number_to_right){
    var password = '',
        digit_password = '';

    var chars = Calcip.password.getChars(alpha),
        litteras = Calcip.password.getLitteras(chars),
        noLitteras = Calcip.password.getNoLitteras(chars, litteras),
        digits = Calcip.password.getDigits(alpha), i= 0, temp_char='', len_litteras = 0, max_litteras_len = 3;

    temp_char = Calcip.password.getRandomChar(chars);
    for(i=0;i<password_length;i++){
        password += temp_char;
        if(Calcip.password.isLitteraVocale(temp_char)){
            len_litteras += 1;
            if(len_litteras==max_litteras_len){
                len_litteras = 0;
                temp_char = Calcip.password.getRandomChar(noLitteras);
            }else{
                temp_char = Calcip.password.getRandomChar(chars);
            }
        }else{
            temp_char = Calcip.password.getRandomChar(litteras);
        }
    }

    for(i=0;i<number_length;i++){
        digit_password += Calcip.password.getRandomChar(digits);
    }

    if(number_to_right){
        password += digit_password;
    }else{
        password = digit_password+password;
    }

    return password;
};


Calcip.algorythms = {
    'plain': function(name, pass) {
         return name + ':' + pass;
    },
    'sha1': function(name, pass) {
        var hash = CryptoJS.SHA1(pass);
        return name + ':{SHA}' + hash.toString(CryptoJS.enc.Base64);
    },
    'ssha1': function(name, pass) {
        var salt = CryptoJS.lib.WordArray.random(32/8);
        var sha1 = CryptoJS.algo.SHA1.create();
        sha1.update(pass);
        sha1.update(salt);
        var hash = sha1.finalize();
        return name + ':{SSHA}' + hash.concat(salt).toString(CryptoJS.enc.Base64);
    },
    'md5': function(name, pass){
        var hash_md5 = CryptoJS.MD5(pass);
        return name + ':' + hash_md5.toString(CryptoJS.enc.Base64);
    },
    'crypt': function(name, pass){
        var hash = CryptoJS.PHP_CRYPT_MD5(pass, Calcip.createSalt(8));
        return name + ':' + hash;
    }
};

$(document).ready(function(){
    var cidr_handler = $('#cidr'),
        ip_handler = $('#ip'),
        next_handler = $('#next'),
        last_handler = $('#last'),
        resultTableTemplate = _.template(Calcip.T.resultTable),
        resultMacTableTemplate = _.template(Calcip.T.resultMacTable);

    function updateNeighboursNetworks(ip_val, cidr_val){
//        console.log(Calcip.neighbours);
        next_handler.addClass('disabled');
        last_handler.addClass('disabled');
        Calcip.neighbours= Calcip.Utils.getNetworkNeighbours(ip_val, cidr_val);
        if(Calcip.neighbours.length==1){
            if(Calcip.neighbours[0].length){
                last_handler.removeClass('disabled');
            }
        }else if(Calcip.neighbours.length==2){
            next_handler.removeClass('disabled');
            if(Calcip.neighbours[0].length){
                last_handler.removeClass('disabled');
            }
        }
    }

    last_handler.click(function(){
        if(Calcip.neighbours.length&&Calcip.neighbours[0].length){
            ip_handler.val(Calcip.neighbours[0][0]+' '+ Calcip.neighbours[0][2]);
            cidr_handler.val(Calcip.neighbours[0][1]);
            showResult(Calcip.neighbours[0][0], Calcip.neighbours[0][1], false);
//            console.log(Calcip.neighbours[0]);
        }
    });

    next_handler.click(function(){
        if(Calcip.neighbours.length == 2){
            ip_handler.val(Calcip.neighbours[1][0]+' '+ Calcip.neighbours[1][2]);
            cidr_handler.val(Calcip.neighbours[1][1]);
            showResult(Calcip.neighbours[1][0], Calcip.neighbours[1][1], false);
//            console.log(Calcip.neighbours[1]);
        }
    });

    function showResult(ip_val, cidr_val, cidr_priority){
        $('#table_result').remove();
        var ip_val_arr = ip_val.split(' ');
        if(!cidr_priority){
            if(ip_val_arr.length==2){
                if(Calcip.Exp.ip.test(ip_val_arr[0])&&Calcip.Exp.netmask.test(ip_val_arr[1])){
                    cidr_val = Calcip.Utils.calcCidrByNetmask(ip_val_arr[1]);
                    ip_val = ip_val_arr[0];
                    cidr_handler.val(cidr_val);
                    ip_handler.parent().after(resultTableTemplate({result: Calcip.calculate(ip_val, cidr_val)}));
                    updateNeighboursNetworks(ip_val, cidr_val);
                }
            }else{
                if(ip_val&&Calcip.Exp.ip.test(ip_val)&&cidr_val&&Calcip.Exp.cidr.test(cidr_val)){
                    ip_handler.parent().after(resultTableTemplate({result: Calcip.calculate(ip_val, cidr_val)}));
                    updateNeighboursNetworks(ip_val, cidr_val);
                }
            }
        }else{
            showResult(ip_val_arr[0], cidr_val, false)
        }
    }

    cidr_handler.autocomplete({
        zIndex: 100500,
        autoSelectFirst: true,
        minChars:0,
        onSelect: function(i){
            var ip_val = ip_handler.val(),
                ip_val_arr = ip_val.split(' ');

            ip_handler.val(ip_val_arr[0]+' '+ i.netmask.substr(1, i.netmask.length-2));
            showResult(ip_val_arr[0], i.cidr, false);
        },
        lookup: Calcip.Utils.getCidrList(),
        lookupFilter: function (suggestion, originalQuery, queryLowerCase) {
            var cidrRegexp = new RegExp('^'+queryLowerCase,'i');
            return cidrRegexp.test(suggestion.value);
        },
        formatResult: function (suggestion, currentValue) {
            var pattern = '^(' + currentValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + ')';
            return suggestion.value.replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>')+' '+suggestion.netmask;
        },
        offsetTop: 0,
        offsetLeft: 0
    });

    cidr_handler.focus(function(){
        var self = $(this);
        self.data('autocomplete').getSuggestions(self.val());
    });

    cidr_handler.keyup(function(event){
        var ip_val = ip_handler.val(),
            ip_val_arr = ip_val.split(' '),
            cidr = event.currentTarget.value;
        if(Calcip.Exp.cidr.test(cidr)){
            var netmask = Calcip.Utils.calcNetworkMask(cidr).join('.');
                ip_handler.val(ip_val_arr[0]+' '+ netmask);
            showResult(ip_val_arr[0], cidr, true);
        }
    });

    ip_handler.keyup(function(event){
        if(Calcip.Exp.comma.test(event.currentTarget.value)){
            event.currentTarget.value = event.currentTarget.value.replace(',', '.');
            event.stopPropagation();
            $(this).trigger('keyup', event);
        }

        showResult(event.currentTarget.value, cidr_handler.val(), false);
    });

    var mac_button = $('#mac'),
        separator_handler = $('#mac_separator'),
        mac_clear_button = $('#mac_clear');

    separator_handler.autocomplete({
        zIndex: 100500,
        autoSelectFirst: true,
        minChars:0,
        lookup: [{value:':'}, {value:'-'}, {value:' '}],
        onSelect: function(i){
            mac_button.trigger('click');
        },
        offsetTop: 0,
        offsetLeft: 0
    });

    mac_button.click(function(event){
        $(this).parent().after(resultMacTableTemplate({result: Calcip.Utils.getMacAddress(separator_handler.val())}));
        var i=0;
        $('table.mac_result').each(function(){
            i+=1;
            if(i>3){
                $(this).remove();
            }
        });
        return false;
    });

    mac_clear_button.click(function(event){
        $('#mac_form')[0].reset();
        $('table.mac_result').remove();
        return false;
    });

    var base64_button = $('#base64'),
        base64_exchange_button=$('#base64_exchange'),
        base64_mode_encode = $('#base64_mode_encode'),
        base64_mode_decode = $('#base64_mode_decode'),
        base64_source_handler = $('#base64_source'),
        base64_result_handler = $('#base64_result');

    base64_button.click(function(){
        var source_text = base64_source_handler.val();
        if(source_text.length){
            if(base64_mode_encode.is(':checked')){
                base64_result_handler.val(Calcip.Base64.base64EncArr(Calcip.Base64.strToUTF8Arr(source_text)));
            }else if(base64_mode_decode.is(':checked')){
                base64_result_handler.val(Calcip.Base64.UTF8ArrToStr(Calcip.Base64.base64DecToArr(source_text)));
            }
        }else{
            base64_result_handler.val('');
        }
    });

    base64_mode_encode.click(function(){
        base64_button.trigger('click');
    });

    base64_mode_decode.click(function(){
        base64_button.trigger('click');
    });

    base64_source_handler.keyup(function(){
        base64_button.trigger('click');
    });

    base64_exchange_button.click(function(){
        var temp_text = base64_source_handler.val();
        base64_source_handler.val(base64_result_handler.val());
        base64_result_handler.val(temp_text);
    });

    var htpasswd_login_handler = $('#htpasswd_login'),
        htpasswd_password_handler = $('#htpasswd_password'),
        htpasswd_algorythm_handler = $('#htpasswd_algorythm'),
        htpasswd_button = $('#htpasswd'),
        htpasswd_result_handler = $('#htpasswd_result'),
        htpasswd_clear_button = $('#htpasswd_clear');

    htpasswd_algorythm_handler.change(function(){
        htpasswd_button.trigger('click');
    });

    htpasswd_login_handler.on('input', function(){
        htpasswd_button.trigger('click');
    });

    htpasswd_password_handler.on('input', function(){
        htpasswd_button.trigger('click');
    });

    htpasswd_button.click(function(){
        var algorythm = htpasswd_algorythm_handler.val(),
            login = htpasswd_login_handler.val(),
            password = htpasswd_password_handler.val();
        if(algorythm.length&&login.length&&password.length){
            htpasswd_result_handler.html(Calcip.algorythms[algorythm](login, password));
        }else{
            htpasswd_result_handler.html('-');
        }
    });

    htpasswd_clear_button.click(function(){
        htpasswd_algorythm_handler.val('');
        htpasswd_login_handler.val('');
        htpasswd_password_handler.val('');
        htpasswd_result_handler.html('-');
    });

    var password_container_handler = $('#password_container'),
        password_type_handler = $('#password_type'),
        password_generator_button = $('#password'),
        password_result_handler = $('#password_result'),
        checkbox_similar = password_container_handler.find('input[name="similar"]'),
        checkbox_lowercase = password_container_handler.find('input[name="lowercase"]'),
        checkbox_cyrillic = password_container_handler.find('input[name="cyrillic"]'),
        checkbox_digits = password_container_handler.find('input[name="digits"]'),
        checkbox_punctuation = password_container_handler.find('input[name="punctuation"]'),
        checkbox_phonetic = password_container_handler.find('input[name="phonetic"]'),
        checkbox_number_to_right = password_container_handler.find('input[name="number_to_right"]'),
        password_length_handler = password_container_handler.find('input[name="password_length"]'),
        password_alpha_handler = password_container_handler.find('input[name="password_alpha"]'),
        number_length_handler = password_container_handler.find('input[name="number_length"]');

    Calcip.password.fillAlpha = function(){
        var password_type = parseInt(password_type_handler.val()),
            lowercase = checkbox_lowercase.is(':checked'),
            similar = checkbox_similar.is(':checked'),
            digits = password_type==1 ? checkbox_digits.is(':checked'): true,
            punctuation = password_type==1 ? checkbox_punctuation.is(':checked'): false,
            cyrillic = checkbox_cyrillic.is(':checked');

        password_alpha_handler.val(Calcip.password.createAlpha(digits, punctuation, lowercase, cyrillic, similar));
    };

    Calcip.password.create_passwords = function(){
        var password_type = parseInt(password_type_handler.val()),
            password_length = parseInt(password_length_handler.val()),
            number_length = parseInt(number_length_handler.val()),
            number_to_right = checkbox_number_to_right.is(':checked'),
            passwords_count = 10,
            passwords = [],
            i,
            alpha = password_alpha_handler.val();

        if(password_type==1){
            for(i=0;i<passwords_count;i++){
                passwords.push(Calcip.password.createPassword(alpha, password_length));
            }
        }else{ //simple
            for(i=0;i<passwords_count;i++){
                passwords.push(Calcip.password.createSimplePassword(alpha, password_length, number_length, number_to_right));
            }
        }

        Calcip.password.passwords = passwords;
        return passwords;
    };

    Calcip.password.show_passwords = function(passwords, phonetic){
        var result = '<table class="table table-hover table-condensed passwords_result"><thead><tr><th>№</th><th>Пароль</th></tr><tbody>', i;
        for(i in passwords){
            result += '<tr><td>'+(parseInt(i)+1)+'</td><td><code>'+($('<div/>').text(passwords[i]).html())+'</code></td></tr>';
            if(phonetic){
                   result += '<tr><td></td><td title="Фонетический словарь">'+Calcip.password.createPhoneticString(passwords[i])+'</td></tr>';
            }
        }
        result += '</tbody></table>';
        return result;
    };

    checkbox_phonetic.click(function(){
        var checked = checkbox_phonetic.is(':checked');
        if(Calcip.password.passwords.length){
            password_result_handler.html(Calcip.password.show_passwords(Calcip.password.passwords, checked));
        }else{
            password_result_handler.html(Calcip.password.show_passwords(Calcip.password.create_passwords(), checked));
        }
    });

    Calcip.password.updateAlpha = function(){
        var checked = checkbox_phonetic.is(':checked');
        Calcip.password.fillAlpha();
        password_result_handler.html(Calcip.password.show_passwords(Calcip.password.create_passwords(), checked));
    };

    checkbox_cyrillic.click(function(){
        Calcip.password.updateAlpha();
    });

    checkbox_digits.click(function(){
        Calcip.password.updateAlpha();
    });

    checkbox_lowercase.click(function(){
        Calcip.password.updateAlpha();
    });

    checkbox_punctuation.click(function(){
        Calcip.password.updateAlpha();
    });

    checkbox_similar.click(function(){
        Calcip.password.updateAlpha();
    });

    checkbox_number_to_right.click(function(){
        Calcip.password.updateAlpha();
    });

    password_length_handler.change(function(){
        Calcip.password.updateAlpha();
    });

    number_length_handler.change(function(){
        Calcip.password.updateAlpha();
    });

    password_alpha_handler.keyup(function(){
        password_result_handler.html(Calcip.password.show_passwords(Calcip.password.create_passwords(), checkbox_phonetic.is(':checked')));
    });

    password_type_handler.change(function(){
        var password_type = $(this).val(),
            passwords = [];
            password_container_handler.find('[data-type]').hide();
            password_container_handler.find('[data-type="'+password_type+'"]').show();

        Calcip.password.fillAlpha();
        password_result_handler.html(Calcip.password.show_passwords(Calcip.password.create_passwords(), checkbox_phonetic.is(':checked')));
    });


    password_generator_button.click(function(){
        password_result_handler.html(Calcip.password.show_passwords(Calcip.password.create_passwords(), checkbox_phonetic.is(':checked')));
    });

    Calcip.password.fillAlpha();

    var timestamp_button = $('#timestamp'),
        timestamp_exchange_button=$('#timestamp_exchange'),
        timestamp_mode_encode = $('#timestamp_mode_encode'),
        timestamp_mode_decode = $('#timestamp_mode_decode'),
        timestamp_source_handler = $('#timestamp_source'),
        timestamp_result_handler = $('#timestamp_result');

    Calcip.get_date = function(date_item){
        return date_item.getUTCFullYear()+'-'+Calcip.Utils.padTo(''+(date_item.getUTCMonth()+1), 2)+'-'+Calcip.Utils.padTo(''+date_item.getUTCDate(), 2)+' '+Calcip.Utils.padTo(''+date_item.getUTCHours(),2)+':'+Calcip.Utils.padTo(''+date_item.getUTCMinutes(),2)+':'+Calcip.Utils.padTo(''+date_item.getUTCSeconds(),2);
    };

    Calcip.timestamp_to_time = function(timestamp){
        var timestamp_reg = /^\d+$/, date_time;
        if(timestamp_reg.test(timestamp)){
            if(timestamp.length<=10){
                timestamp = parseInt(timestamp)*1000;
            }
            var date_item = new Date(parseInt(timestamp));
            return Calcip.get_date(date_item);
        }else{
            return 'Не корректно '+timestamp;
        }
    };

    Calcip.time_to_timestamp = function(time){
        var time_regexp = /^\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}$/;
        if(time_regexp.test(time)){
            return parseInt(Date.parse(time)/1000);
        }else{
            return 'Не корректно '+ time;
        }
    };

    timestamp_button.click(function(){
        var source_text=timestamp_source_handler.val(), result=[], lines=[], i=0;
        if(source_text.length){
            lines = source_text.split(/\r|\r\n|\n/);
            if(timestamp_mode_encode.is(':checked')){
                for(i in lines){
                    result.push(Calcip.timestamp_to_time(lines[i]));
                }
            }else if(timestamp_mode_decode.is(':checked')){
                for(i in lines){
                    result.push(Calcip.time_to_timestamp(lines[i]));
                }
            }
            timestamp_result_handler.val(result.join("\n"));
        }else{
            if(timestamp_mode_encode.is(':checked')){
                timestamp_result_handler.val('Введите количество секунд с даты основания UNIX эпохи');
            }else if(timestamp_mode_decode.is(':checked')){
                timestamp_result_handler.val('Введите время в формате ГГГГ-ММ-ДД ЧЧ:мм:cc');
            }
        }
    });

    if(timestamp_mode_encode.is(':checked')){
        timestamp_source_handler.val(parseInt(new Date().getTime()/1000));
    }else if(timestamp_mode_decode.is(':checked')){
        timestamp_source_handler.val(Calcip.get_date(new Date()));
    }

    timestamp_mode_encode.click(function(){
        timestamp_button.trigger('click');
    });

    timestamp_mode_decode.click(function(){
        timestamp_button.trigger('click');
    });

    timestamp_source_handler.keyup(function(){
        timestamp_button.trigger('click');
    });

    timestamp_exchange_button.click(function(){
        var temp_text = timestamp_source_handler.val();
        timestamp_source_handler.val(timestamp_result_handler.val());
        timestamp_result_handler.val(temp_text);
    });


    var ip_button_handler = $('#ip_button'),
        mac_button_handler = $('#mac_button'),
        base64_button_handler = $('#base64_button'),
        htpasswd_button_handler = $('#htpasswd_button'),
        password_button_handler = $('#password_button'),
        timestamp_button_handler = $('#timestamp_button'),
        ip_container_handler = $('#ip_container'),
        mac_container_handler = $('#mac_container'),
        base64_container_handler = $('#base64_container'),
        timestamp_container_handler = $('#timestamp_container'),
        htpasswd_container_handler = $('#htpasswd_container');

    ip_button_handler.click(function(){
        $(this).addClass('active');
        mac_button_handler.removeClass('active');
        base64_button_handler.removeClass('active');
        htpasswd_button_handler.removeClass('active');
        password_button_handler.removeClass('active');
        timestamp_button_handler.removeClass('active');
        timestamp_container_handler.hide();
        mac_container_handler.hide();
        base64_container_handler.hide();
        htpasswd_container_handler.hide();
        password_container_handler.hide();
        ip_container_handler.show();
    });

    mac_button_handler.click(function(){
        $(this).addClass('active');
        ip_button_handler.removeClass('active');
        base64_button_handler.removeClass('active');
        htpasswd_button_handler.removeClass('active');
        password_button_handler.removeClass('active');
        timestamp_button_handler.removeClass('active');
        timestamp_container_handler.hide();
        ip_container_handler.hide();
        base64_container_handler.hide();
        htpasswd_container_handler.hide();
        password_container_handler.hide();
        mac_container_handler.show();
    });

    base64_button_handler.click(function(){
        $(this).addClass('active');
        mac_button_handler.removeClass('active');
        ip_button_handler.removeClass('active');
        htpasswd_button_handler.removeClass('active');
        password_button_handler.removeClass('active');
        timestamp_button_handler.removeClass('active');
        timestamp_container_handler.hide();
        ip_container_handler.hide();
        mac_container_handler.hide();
        htpasswd_container_handler.hide();
        password_container_handler.hide();
        base64_container_handler.show();
    });

    htpasswd_button_handler.click(function(){
        $(this).addClass('active');
        mac_button_handler.removeClass('active');
        ip_button_handler.removeClass('active');
        base64_button_handler.removeClass('active');
        password_button_handler.removeClass('active');
        timestamp_button_handler.removeClass('active');
        timestamp_container_handler.hide();
        ip_container_handler.hide();
        mac_container_handler.hide();
        base64_container_handler.hide();
        password_container_handler.hide();
        htpasswd_container_handler.show();
    });

    password_button_handler.click(function(){
        $(this).addClass('active');
        mac_button_handler.removeClass('active');
        ip_button_handler.removeClass('active');
        base64_button_handler.removeClass('active');
        htpasswd_button_handler.removeClass('active');
        timestamp_button_handler.removeClass('active');
        timestamp_container_handler.hide();
        ip_container_handler.hide();
        mac_container_handler.hide();
        base64_container_handler.hide();
        htpasswd_container_handler.hide();
        password_container_handler.show();
    });

    timestamp_button_handler.click(function(){
        $(this).addClass('active');
        mac_button_handler.removeClass('active');
        ip_button_handler.removeClass('active');
        base64_button_handler.removeClass('active');
        htpasswd_button_handler.removeClass('active');
        password_button_handler.removeClass('active');
        ip_container_handler.hide();
        mac_container_handler.hide();
        base64_container_handler.hide();
        htpasswd_container_handler.hide();
        password_container_handler.hide();
        timestamp_container_handler.show();
    });
});