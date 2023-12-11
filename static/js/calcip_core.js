if(typeof(Calcip) === 'undefined'){Calcip={};}

if(typeof(Calcip.Utils) === 'undefined'){

    function InitArray() {
        this.length = InitArray.arguments.length;
        for (var i = 0; i < this.length; i++)
            this[i] = InitArray.arguments[i];
    }

    Calcip.Utils={
        cache: [],

        //regexp functions
        valueStr:function(value, num) {
            return new Array(num+1).join(value);
        },
        naiveRange: function(min,max) {
                /*Simply matches min, to max digits by position.  Should create a
                valid regex when min and max have same num digits and has same 10s
                place digit.*/
            var _min=min.toString(),
                _max=max.toString(),
                pattern='', i;

            for(i=0;i<_min.length;i+=1){
                if(_min[i]==_max[i]){
                   pattern+=_min[i];
                }else{
                   pattern+='['+_min[i]+'-'+_max[i]+']';
                }
            }
            return pattern;
        },
        floorDigitN:function(x, increment){
            /* create a function to return a floor to the correct digit position
            e.g., floorDigitN(1336) => 1300 when increment is 100*/
            return parseInt(Math.floor(x/increment)*increment);
        },

        regExpForRange:function(min, max){
            var cache_index = 'regexprange:'+min+'-'+max,
                result_cache = this.cache[cache_index],
                result;
            if(typeof(result_cache)!=='undefined'){
                return result_cache;
            }else{
                /*  A recursive function to generate a regular expression that matches
                any number in the range between min and max inclusive.

                Note: doctests are order sensitive, while regular expression engines don't care.  So you may need to rewrite these
                doctests if making changes.
                */
                var _min=min.toString(),
                    _max=max.toString(),
                    re_middle_range,
                    max_big,
                    min_big,
                    max_small,
                    min_small,
                    re_small,
                    re_big,
                    i;

                if(min==max){
                    result = _max;
                }

                if(_max.length>_min.length){
                    /*more digits in max than min, so we pair it down into sub ranges
                    that are the same number of digits.  If applicable we also create a pattern to
                    cover the cases of values with number of digits in between that of
                    max and min.*/
                    if(_max.length>_min.length+2){
                        // digits more than 2 off, create mid range
                        re_middle_range='[0-9]{'+(_min.length+1)+','+(_max.length-1)+'}';
                    }else if(_max.length>_min.length+1){
                        /*digits more than 1 off, create mid range
                        assert _min.length+1==_max.length-1 #temp: remove*/
                        re_middle_range='[0-9]{'+(_min.length+1)+'}';
                    }
                    //pair off into sub ranges
                    max_big=max;
                    min_big=parseInt('1'+(this.valueStr('0',_max.length-1)));
                    re_big=this.regExpForRange(min_big, max_big);
                    max_small=parseInt(this.valueStr('9',_min.length));
                    min_small=min;
                    re_small=this.regExpForRange(min_small,max_small);
                    if(re_middle_range){
                        result = [re_small,re_middle_range,re_big].join('|');
                    }else{
                        result = [re_small,re_big].join('|');
                    }
                } else if(_max.length==_min.length){
                    var patterns = [],
                        distance,
                        increment,
                        len_end_to_replace,
                        pattern,
                        pattern_tmp;
                    if(_max.length==1){
                        patterns=[this.naiveRange(min,max)];
                    }else{
                        /* this is probably the trickiest part so we'll follow the example of
                         1336 to 1821 through this section */
                        patterns=[];
                        distance=(max-min).toString(); //e.g., distance = 1821-1336 = 485
                        increment=parseInt('1'+this.valueStr('0',distance.length-1)); //e.g., 100 when distance is 485
                        if(increment==1){
                            // it's safe to do a naiveRange see, see def since 10's place is the same for min and max
                            patterns=[this.naiveRange(min,max)];
                        }else{

                            /* capture a safe middle range
                               e.g., create regex patterns to cover range between 1400 to 1800 inclusive
                               so in example we should get: 14[0-9]{2}|15[0-9]{2}|16[0-9]{2}|17[0-9]{2}*/

                            for(i=this.floorDigitN(max, increment)-increment; i>this.floorDigitN(min, increment); i-=increment){
                                len_end_to_replace=increment.toString().length-1;
                                pattern_tmp = i.toString();
                                if(len_end_to_replace==1){
                                    pattern=pattern_tmp.substring(0,pattern_tmp.length-len_end_to_replace)+'[0-9]';
                                }else{
                                    pattern=pattern_tmp.substring(0,pattern_tmp.length-len_end_to_replace)+'[0-9]{'+len_end_to_replace+'}';
                                }
                                patterns.push(pattern);
                            }
                            /* split off ranges outside of increment digits, i.e., what isn't covered in last step.
                               low side: e.g., 1336 -> min=1336, max=1300+(100-1) = 1399 */
                            patterns.push(this.regExpForRange(min,this.floorDigitN(min, increment)+(increment-1)));
                            // high side: e.g., 1821 -> min=1800 max=1821
                            patterns.push(this.regExpForRange(this.floorDigitN(max, increment),max))
                        }
                    }
                    result = patterns.join('|');
                } else {
                    result = this.regExpForRange(max, min);
                }
                this.cache[cache_index] = result;
                return result;
            }
        },

        //network functions
        padTo: function(value, num) {
            return value.length<=num?new Array(num+1-value.length).join('0')+value:value;
        },
        setIpFromStrToInt: function(strIp){
            var strIpArr = strIp.split('.'), binStrIp='';
            for(var i in strIpArr){
                binStrIp += this.padTo(parseInt(strIpArr[i],10).toString(2),8);
            }
            return parseInt(binStrIp,2);
        },
        setIpFromIntToStr: function(intIp){
            var result='', binIp = this.padTo(intIp.toString(2), 32);
            for(var i=0;i<4;i+=1){
                result += '.'+parseInt(binIp.substr(i*8,8), 2);
            }
            return result.slice(1);
        },

        calcNetworkClass: function (prefix){
            var result = '';
            if(prefix>=8 && prefix<=15){
                result = 'A';
            }else if(prefix>=16 && prefix<=24){
                result = 'B';
            }else if(prefix>=25 && prefix<=32){
                result = 'C';
            }
            return result;
        },
        from10ToRadix: function(value,radix){
            var retval = '',
            ConvArray = new InitArray(0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F'),
            intnum,
            tmpnum,
            i = 0;

            intnum = parseInt(value,10);
            if (isNaN(intnum)){
                retval = 'NaN';
            }else{
                if (intnum < 1){
                    retval ="0";
                }else{
                    retval = "";
                }
                while (intnum > 0.9){
                    i++;
                    tmpnum = intnum;
                    // cancatinate return string with new digit:
                    retval = ConvArray[tmpnum % radix] + retval;
                    intnum = Math.floor(tmpnum / radix);
                    if (i > 100){
                        // break infinite loops
                        retval = 'NaN';
                        break;
                    }
                }
            }
            return retval;
        },
        calcIpBinViewStrFromInt: function(intIp, cidr){
            cidr=parseInt(cidr);
            var result = '',
                binIp = this.padTo(this.from10ToRadix(intIp,2),32);

            for(var i=0;i<4;i+=1){
                result+='.'+binIp.substr(i*8,8);
            }
            result = result.substr(1);

            if(typeof(cidr)!=='undefined'&&cidr!=32&&cidr!=0){
                var dots_count = Math.floor(cidr/8);
                if(dots_count == cidr/8){
                    result = result.slice(0,cidr+dots_count-1)+'|'+result.slice(cidr+dots_count, result.length);
                }else{
                    result = result.slice(0,cidr+dots_count)+'|'+result.slice(cidr+dots_count, result.length);
                }
            }

            return result;
        },

        calcIpHexViewStrFromInt: function(intIp){
            var result = '',
                hexIp = this.padTo(this.from10ToRadix(intIp,16),8);
            for(var i=0;i<4;i+=1){
                result+=':'+hexIp.substr(i*2,2);
            }
            return result.substr(1);
        },

        fillBitsFromLeft: function(num){
            if (num >= 8 ){
                return(255);
            }
            var bitpat=0xff00;
            while (num > 0){
                bitpat=bitpat >> 1;
                num--;
            }
            return(bitpat & 0xff);
        },
        calcNetworkMask: function(prefix){
            var cache_index = 'netmask:'+prefix,
                result_cache = this.cache[cache_index],
                result;
            if(typeof(result_cache)!=='undefined'){
                return result_cache;
            }else{
                var tmpPrefix = parseInt(prefix,10),
                    msk1=0,msk2=0,msk3=0,msk4=0;

                if (isNaN(tmpPrefix) || tmpPrefix > 32 || tmpPrefix < 0){
//                    console.log('Error netmask prefix: '+prefix);
                    return(1);
                }
                if (tmpPrefix >= 8){
                    msk1 = 255;
                    tmpPrefix-=8;
                }else{
                    msk1 = this.fillBitsFromLeft(tmpPrefix);
                    return([msk1,msk2,msk3,msk4]);
                }
                if (tmpPrefix >= 8){
                    msk2 = 255;
                    tmpPrefix-=8;
                }else{
                    msk2 = this.fillBitsFromLeft(tmpPrefix);
                    return([msk1,msk2,msk3,msk4]);
                }
                if (tmpPrefix >= 8){
                    msk3 = 255;
                    tmpPrefix-=8;
                }else{
                    msk3 = this.fillBitsFromLeft(tmpPrefix);
                    return([msk1,msk2,msk3,msk4]);
                }
                msk4 = this.fillBitsFromLeft(tmpPrefix);
                result = [msk1,msk2,msk3,msk4];
                this.cache[cache_index] = result;
                return result;
            }
        },
        calcCidrByNetmask: function(mask){
            var maskArr = mask.split('.'), binStrIp='';
            for(var i in maskArr){
                binStrIp += this.padTo(parseInt(maskArr[i],10).toString(2),8);
            }
            return binStrIp.split('1').length-1;
        },
        calcNetworkInverseMask: function(prefix){
            var mask =this.calcNetworkMask(prefix);
            return([255-mask[0],255-mask[1],255-mask[2],255-mask[3]]);
        },
        calcNetworkIp: function(ip, prefix){
            var result = [],resultIp,
                ipArr = ip.split('.'),
                netmask = this.calcNetworkMask(prefix);

            for(var i in ipArr){
                result.push((ipArr[i] & netmask[i]));
            }

            return result;
        },
        calcBroadcastIp: function(ip, prefix){
            var result = [],resultIp,
                ipArr = ip.split('.'),
                netmask = this.calcNetworkMask(prefix),
                inverseNetmask = this.calcNetworkInverseMask(prefix);

            for(var i in ipArr){
                result.push((ipArr[i] & netmask[i] | inverseNetmask[i]));
            }
            return result;
        },
        calcHostCount: function(prefix){
            return Math.pow(2,(32-prefix));
        },
        calcMinIp: function(ipArr, prefix){
            return prefix<31?this.setIpFromIntToStr(this.setIpFromStrToInt(ipArr.join('.'))+1).split('.'):ipArr;
        },
        calcMaxIp: function(broadcastArr, prefix){
            return prefix<31?this.setIpFromIntToStr(this.setIpFromStrToInt(broadcastArr.join('.'))-1).split('.'):broadcastArr;
        },
        getIpListFromNetwork: function(ip, prefix){
            var result = [], i, tmpIp;
            var netIp = this.calcNetworkIp(ip, prefix);
            var minIp = this.calcMinIp(netIp, prefix);
            var minIpInt = this.setIpFromStrToInt(minIp.join('.'));
            var broadCastIp = this.calcBroadcastIp(ip, prefix);
            var maxIp = this.calcMaxIp(broadCastIp, prefix);
            var maxIpInt = this.setIpFromStrToInt(maxIp.join('.'));

            for(i=minIpInt;i<=maxIpInt;i++){
                tmpIp = this.setIpFromIntToStr(i);
                result.push(tmpIp);
            }
            return result;
        },
        getSubNetsFromNetwork: function(ip, base_prefix, prefix){
            var result = [], i, tmpIp, subNetIP, subNetBroadcast;
            var netIp = this.calcNetworkIp(ip, base_prefix);
            var minIpInt = this.setIpFromStrToInt(netIp.join('.'));
            var broadCastIp = this.calcBroadcastIp(ip, base_prefix);
            var maxIpInt = this.setIpFromStrToInt(broadCastIp.join('.'));

            for(i = minIpInt;i<=maxIpInt;i++){
                subNetIP = this.calcNetworkIp(this.setIpFromIntToStr(i), prefix);
                subNetBroadcast = this.calcBroadcastIp(subNetIP.join('.'), prefix);
                tmpIp = this.setIpFromIntToStr(i);
                i = this.setIpFromStrToInt(subNetBroadcast.join('.'));
                result.push(tmpIp);
            }
            return result;
        },
        isAddressInAddress: function(address_ip, address_prefix, network_ip, network_prefix){
            if(address_prefix<network_prefix){
                var address_prefix_tmp = address_prefix;
                address_prefix = network_prefix;
                network_prefix = address_prefix_tmp;
                var address_ip_tmp = address_ip;
                address_ip = network_ip;
                network_ip = address_ip_tmp;
            }

            var addressIpInt, addressNetIp, addressMinIpInt, addressBroadCastIp, addressMaxIpInt;
            if(network_prefix!=32){
                var netIp = this.calcNetworkIp(network_ip, network_prefix);
                var minIpInt = this.setIpFromStrToInt(netIp.join('.'));
                var broadCastIp = this.calcBroadcastIp(network_ip, network_prefix);
                var maxIpInt = this.setIpFromStrToInt(broadCastIp.join('.'));
                if(address_prefix==32){
                    addressIpInt = this.setIpFromStrToInt(address_ip);
                    return minIpInt <= addressIpInt && addressIpInt<= maxIpInt;
                }else{
                    addressNetIp = this.calcNetworkIp(address_ip, address_prefix);
                    addressMinIpInt = this.setIpFromStrToInt(addressNetIp.join('.'));
                    addressBroadCastIp = this.calcBroadcastIp(address_ip, address_prefix);
                    addressMaxIpInt = this.setIpFromStrToInt(addressBroadCastIp.join('.'));
                    return minIpInt<=addressMinIpInt && addressMaxIpInt<=maxIpInt;
                }
            }else{
                var netIpInt = this.setIpFromStrToInt(network_ip);
                if(address_prefix==32){
                    addressIpInt = this.setIpFromStrToInt(address_ip);
                    return netIpInt == addressIpInt;
                }else{
                    addressNetIp = this.calcNetworkIp(address_ip, address_prefix);
                    addressMinIpInt = this.setIpFromStrToInt(addressNetIp.join('.'));
                    addressBroadCastIp = this.calcBroadcastIp(address_ip, address_prefix);
                    addressMaxIpInt = this.setIpFromStrToInt(addressBroadCastIp.join('.'));
                    return addressMinIpInt <= netIpInt && netIpInt <= addressMaxIpInt;
                }
            }
        },
        getCidrList: function(){
            var result = [], i, netmask ='';
            for(i=1;i<33;i++){
                netmask = this.calcNetworkMask(i).join('.');
                result.push({value: i.toString(), netmask:'('+netmask+')', cidr: i});
            }
            return result;
        },
        getMacAddress: function(sep){
            var i= 2, result=['00','16','3E'];
            if(typeof(sep)=='undefined'){
                sep=':';
            }
            result.push(Calcip.Utils.padTo(Calcip.Utils.from10ToRadix((127*Math.random()).toFixed(), 16),2));
            while(i--){
                result.push(Calcip.Utils.padTo(Calcip.Utils.from10ToRadix((255*Math.random()).toFixed(), 16), 2));
            }
            return [result.join(sep), result.join(':').toLowerCase()];
        },
        getNetworkNeighbours: function(network_ip, network_prefix){
            var result = [],
                netIp = this.calcNetworkIp(network_ip, network_prefix),
                minIpInt = this.setIpFromStrToInt(netIp.join('.')),
                broadCastIp = this.calcBroadcastIp(network_ip, network_prefix),
                maxIpInt = this.setIpFromStrToInt(broadCastIp.join('.')),
                netmask = this.calcNetworkMask(network_prefix).join('.');

            if((minIpInt-(maxIpInt-minIpInt))>0){
                var previousNetworkIp = this.calcNetworkIp(this.setIpFromIntToStr(minIpInt - 1), network_prefix).join('.');
                    result.push([previousNetworkIp, network_prefix, netmask]);
            }else{
                result.push([]);
            }
            if(maxIpInt+1<3758096384){ // > 224.0.0.0 multicast and reserved
                var nextNetworkIp = this.calcNetworkIp(this.setIpFromIntToStr(maxIpInt + 1), network_prefix).join('.');
                result.push([nextNetworkIp, network_prefix, netmask]);
            }
            return result;
        }
    };

    Calcip.Base64={
        b64ToUint6: function (nChr) {

          return nChr > 64 && nChr < 91 ?
              nChr - 65
            : nChr > 96 && nChr < 123 ?
              nChr - 71
            : nChr > 47 && nChr < 58 ?
              nChr + 4
            : nChr === 43 ?
              62
            : nChr === 47 ?
              63
            :
              0;

        },

        base64DecToArr: function(sBase64, nBlocksSize) {

          var
            sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
            nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

          for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= this.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
              for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
              }
              nUint24 = 0;

            }
          }

          return taBytes;
        },

        /* Base64 string to array encoding */

        uint6ToB64: function(nUint6) {

          return nUint6 < 26 ?
              nUint6 + 65
            : nUint6 < 52 ?
              nUint6 + 71
            : nUint6 < 62 ?
              nUint6 - 4
            : nUint6 === 62 ?
              43
            : nUint6 === 63 ?
              47
            :
              65;

        },

        base64EncArr: function(aBytes) {

          var nMod3 = 2, sB64Enc = "";

          for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
            nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
              sB64Enc += String.fromCharCode(this.uint6ToB64(nUint24 >>> 18 & 63), this.uint6ToB64(nUint24 >>> 12 & 63), this.uint6ToB64(nUint24 >>> 6 & 63), this.uint6ToB64(nUint24 & 63));
              nUint24 = 0;
            }
          }

          return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');
        },

    /* UTF-8 array to DOMString and vice versa */

    UTF8ArrToStr: function (aBytes) {

      var sView = "";

      for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
        nPart = aBytes[nIdx];
        sView += String.fromCharCode(
          nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
            /* (nPart - 252 << 32) is not possible in ECMAScript! So...: */
            (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
            (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
            (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
            (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
          : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
            (nPart - 192 << 6) + aBytes[++nIdx] - 128
          : /* nPart < 127 ? */ /* one byte */
            nPart
        );
      }

      return sView;
    },

    strToUTF8Arr: function (sDOMStr) {

      var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

      /* mapping... */

      for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
        nChr = sDOMStr.charCodeAt(nMapIdx);
        nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
      }

      aBytes = new Uint8Array(nArrLen);

      /* transcription... */

      for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
        nChr = sDOMStr.charCodeAt(nChrIdx);
        if (nChr < 128) {
          /* one byte */
          aBytes[nIdx++] = nChr;
        } else if (nChr < 0x800) {
          /* two bytes */
          aBytes[nIdx++] = 192 + (nChr >>> 6);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x10000) {
          /* three bytes */
          aBytes[nIdx++] = 224 + (nChr >>> 12);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x200000) {
          /* four bytes */
          aBytes[nIdx++] = 240 + (nChr >>> 18);
          aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x4000000) {
          /* five bytes */
          aBytes[nIdx++] = 248 + (nChr >>> 24);
          aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        } else /* if (nChr <= 0x7fffffff) */ {
          /* six bytes */
          aBytes[nIdx++] = 252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824);
          aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
          aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
          aBytes[nIdx++] = 128 + (nChr & 63);
        }
      }

      return aBytes;

    }
    };

    Calcip.Propis={
        firstUpper: function(word){
            return word.charAt(0).toUpperCase() + word.slice(1);
        },
        toNumberStr: function(num){
            return (num).toString();
        },
        toNumber: function(str){
            var result = Number(str)
            return isNaN(result) ? 0: result;
        },
        rtrim : function(str) {
            return str.replace(new RegExp('\r\n$'), '');
        },
        letters: function(num){
            var result = '';
            num=num.replace(/\s+/g,"");
            console.log(num)
            switch(num){
                case'∞': result = 'Символ бесконечности'; return result;
            }
            var v = num.split(/\D+/g);

            if(!v[1] || this.toNumber(v[1])<1){
                num=this.toNumberStr(num);
                result = this.firstUpper(this.propis(num));
            }else{
                var o=[];
                v[0]=this.toNumberStr(v[0]);
                o[o.length]=this.propis(v[0],true);
                o[o.length]=this.ci(v[0],['цел','ых','ая','ых']);
                v[1]=this.rtrim(v[1],'0');
                o[o.length]=this.propis(v[1],true);
                o[o.length]=this.fletters(v[1]);
                result = this.firstUpper(o.join(' '));
            }
            return result;
        },

        // Окончание для числительных
        ci: function(n,c){
            n=n.toString().split(".")[0].substr(-2);
            if(c)return c[0]+((/^[0,2-9]?[1]$/.test(n))?c[2]||'':((/^[0,2-9]?[2-4]$/.test(n))?c[3]||'':c[1]||''));
        },

        propis: function propis(num,w){
            if(num<0)num=-num;
            num=num.toString().split('.')[0];

            // Все варианты написания разрядов прописью скомпануем в один небольшой массив
            var m=[
                ['ноль'],
                ['-','один','два','три','четыре','пять','шесть','семь','восемь','девять'],
                ['десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'],
                ['-','-','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'],
                ['-','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'],
                ['-','одна','две']
            ]

            // Все варианты написания разрядов прописью скомпануем в один небольшой массив
            var r=[
                ["…n-лион", "ов", "", "а"], // используется для всех неизвестно больших разрядов
                ["тысяч", "", "а", "и"],
                ["миллион", "ов", "", "а"],
                ["миллиард", "ов", "", "а"],
                ["триллион", "ов", "", "а"],
                ["квадриллион", "ов", "", "а"],
                ["квинтиллион", "ов", "", "а"],
                ["секстиллион", "ов", "", "а"],
                ["септиллион", "ов", "", "а"],
                ["октиллион", "ов", "", "а"],
                ["нониллион", "ов", "", "а"],
                ["дециллион", "ов", "", "а"],
                ["ундециллион", "ов", "", "а"],
                ["додециллион", "ов", "", "а"],
                ["тредециллион", "ов", "", "а"],
                ["кваттуордециллион", "ов", "", "а"],
                ["квиндециллион", "ов", "", "а"],
                ["седециллион", "ов", "", "а"],
                ["септдециллион", "ов", "", "а"],
                ["октодециллион", "ов", "", "а"],
                ["новемдециллион", "ов", "", "а"],
                ["вигинтиллион", "ов", "", "а"],
                ["анвигинтиллион", "ов", "", "а"],
                ["дуовигинтиллион", "ов", "", "а"],
                ["тревигинтиллион", "ов", "", "а"],
                ["кватторвигинтиллион", "ов", "", "а"],
                ["квинвигинтиллион", "ов", "", "а"],
                ["сексвигинтиллион", "ов", "", "а"],
                ["септемвигинтиллион", "ов", "", "а"],
                ["октовигинтиллион", "ов", "", "а"],
                ["новемвигинтиллион", "ов", "", "а"],
                ["тригинтиллион", "ов", "", "а"],
                ["антригинтиллион", "ов", "", "а"],
                ["дуотригинтиллион", "ов", "", "а"],
                ["третригинтиллион", "ов", "", "а"], // 10 в 102
                ["кваттуортригинтиллион", "ов", "", "а"],
                ["квинтригинтиллион", "ов", "", "а"],
                ["секстригинтиллион", "ов", "", "а"],
                ["септентригинтиллион", "ов", "", "а"],
                ["октотригинтиллион", "ов", "", "а"],
                ["новемтригинтиллион", "ов", "", "а"],
                ["квадрагинтиллион", "ов", "", "а"], // 10 в 123
                ["унквадрагинтиллион", "ов", "", "а"],
                ["дуоквадрагинтиллион", "ов", "", "а"],
                ["треквадрагинтиллион", "ов", "", "а"],
                ["кваторквадрагинтиллион", "ов", "", "а"],
                ["квинквадрагинтиллион", "ов", "", "а"],
                ["сексквадрагинтиллион", "ов", "", "а"],
                ["септенквадрагинтиллион", "ов", "", "а"],
                ["октоквадрагинтиллион", "ов", "", "а"],
                ["новемквадрагинтиллион", "ов", "", "а"],
                ["квинквагинтиллион", "ов", "", "а"],
                ["унквинкагинтиллион", "ов", "", "а"],
                ["дуоквинкагинтиллион", "ов", "", "а"],
                ["треквинкагинтиллион", "ов", "", "а"],
                ["кваторквинкагинтиллион", "ов", "", "а"],
                ["квинквинкагинтиллион", "ов", "", "а"],
                ["сексквинкагинтиллион", "ов", "", "а"],
                ["септенквинкагинтиллион", "ов", "", "а"],
                ["октоквинкагинтиллион", "ов", "", "а"],
                ["новемквинкагинтиллион", "ов", "", "а"],
                ["сексагинтиллион", "ов", "", "а"],
                ["унсексагинтиллион", "ов", "", "а"],
                ["дуосексагинтиллион", "ов", "", "а"],
                ["тресексагинтиллион", "ов", "", "а"],
                ["кваторсексагинтиллион", "ов", "", "а"],
                ["квинсексагинтиллион", "ов", "", "а"],
                ["секссексагинтиллион", "ов", "", "а"],
                ["септенсексагинтиллион", "ов", "", "а"],
                ["октосексагинтиллион", "ов", "", "а"],
                ["новемсексагинтиллион", "ов", "", "а"],
                ["септагинтиллион", "ов", "", "а"],
                ["унсептагинтиллион", "ов", "", "а"],
                ["дуосептагинтиллион", "ов", "", "а"],
                ["тресептагинтиллион", "ов", "", "а"],
                ["кваторсептагинтиллион", "ов", "", "а"],
                ["квинсептагинтиллион", "ов", "", "а"],
                ["секссептагинтиллион", "ов", "", "а"],
                ["септенсептагинтиллион", "ов", "", "а"],
                ["октосептагинтиллион", "ов", "", "а"],
                ["новемсептагинтиллион", "ов", "", "а"],
                ["октогинтиллион", "ов", "", "а"],
                ["уноктогинтиллион", "ов", "", "а"],
                ["дуооктогинтиллион", "ов", "", "а"],
                ["треоктогинтиллион", "ов", "", "а"],
                ["кватороктогинтиллион", "ов", "", "а"],
                ["квиноктогинтиллион", "ов", "", "а"],
                ["сексоктогинтиллион", "ов", "", "а"],
                ["септоктогинтиллион", "ов", "", "а"],
                ["октооктогинтиллион", "ов", "", "а"],
                ["новемоктогинтиллион", "ов", "", "а"],
                ["нонагинтиллион", "ов", "", "а"],
                ["уннонагинтиллион", "ов", "", "а"],
                ["дуононагинтиллион", "ов", "", "а"],
                ["тренонагинтиллион", "ов", "", "а"],
                ["кваторнонагинтиллион", "ов", "", "а"],
                ["квиннонагинтиллион", "ов", "", "а"],
                ["секснонагинтиллион", "ов", "", "а"],
                ["септеннонагинтиллион", "ов", "", "а"],
                ["октононагинтиллион", "ов", "", "а"],
                ["новемнонагинтиллион", "ов", "", "а"],
                ["центиллион", "ов", "", "а"], // 10^303
                ["анцентиллион", "ов", "", "а"],
                ["дуоцентиллион", "ов", "", "а"], // 10^309
                ["трецентиллион", "ов", "", "а"],
                ["кватторцентиллион", "ов", "", "а"] // 10^315
            //  ["", "ов", "", "а"],
            // ,[... список можно продолжить
            ]

            if(num===0)return m[0][0] // Если число ноль, сразу сообщить об этом и выйти
            var o=[] // Сюда записываем все получаемые результаты преобразования

// Разложим исходное число на несколько трехзначных чисел и каждое полученное такое число обработаем отдельно
            num=['','00','0'][num.split(/\d{3}/).join('').length]+num
            var numlength=num.length;
            var k=0,n=-1;

            while(k*3<numlength){pp=num.substr(-3*(k+1),3);
                if(pp!='000')o[++n]=[];else{k++;continue}
                for(var i=0;i<=2;i++)if(pp[i]==0)continue;else{
                    switch(i){
                        case 0:o[n][o[n].length]=m[4][pp[i]];break
                        case 1:if(pp[i]==1){o[n][o[n].length]=m[2][pp[2]];i=3;continue}else{o[n][o[n].length]=m[3][pp[i]]}break
                        case 2:if((k==1&&pp[i]<=2)||(pp[i]<=2&&w&&(!k||k*3==numlength))){o[n][o[n].length]=m[5][pp[i]]}else{o[n][o[n].length]=m[1][pp[i]]}break
                    }
                }
                if(pp>0&&k>0)o[n][o[n].length]=this.ci(pp,r[k]||r[0]);
                o[n]=o[n].join(' ')
                k++
            }
            return o.reverse().join(" ")
        },

        // Десятичные
        fletters: function(n){
        var r=n.length;
        var d=[
            [],
            ['','десятых','десятая','десятых'],
            ['','сотых','сотая','сотых'],
            ['','тысячных','тысячная','тысячных'],
            ['','десятитысячных','десятитысячная','десятитысячных'],
            ['','стотысячных','стотысячная','стотысячные'],
            ['','миллионных','миллионная','миллионных'],
            ['','десятимиллионных','десятимиллионная','десятимиллионных'],
            ['','стомиллионных','стомиллионная','стомиллионных'],
            ['','миллиардных','миллиардная','миллиардные'],
            ['','десятимиллиардных','десятимиллиардная','десятимиллиардные'],
            ['','стомиллиардных','стомиллиардная','стомиллиардные']
        ];
        return this.ci(n,d[r]);
    }
    };
}
