var Simulator = function(data){

    this._data = data;
    this._interval = null;

    this._nameBegin = 500;
    this._nameIndexMap = {};
    this._exsitNames = []; 

    this._colors = ["#F26077","#DEAD26","#3A8EED","#68BC36"]
    this._lengths =[110,100,80];
    this._widths = [50,55,70];
    this._height = [60,65,80];


    this.createDatas = function(num){

        var datas = [];

        for(var i=0; i<num ;i++){


            var feature = this._data.features[this._randomIndex(this._data.features.length)];
            var name = feature.attributes.NAME;

            if(!this._nameIndexMap[name]){

                this._nameIndexMap[name] = this._nameBegin;
            }

            this._nameIndexMap[name]++;

            var color = this._colors[this._randomIndex(this._colors.length)];
            
            var data = {};

            data.name = name + '-' + this._nameIndexMap[name];
            data.FID = feature.attributes.FID;
            data.color = color;
            data.operation = 'add';
            data.length = this._lengths[this._randomIndex(this._lengths.length)];
            data.width = this._widths[this._randomIndex(this._widths.length)];
            data.height = this._height[this._randomIndex(this._height.length)];

            datas.push(data);

        }

        return datas;

    }

    this.start = function(times,cb){

        if(this._interval != null){

            return;
        }

        var self = this;

        this._interval = setInterval(function(){


            var datas = [];

            for(var i=0; i< times ;i++){

                var operation = Math.random();

                var data = {};

                if(operation<0.95){

                    var feature = self._data.features[self._randomIndex(self._data.features.length)];
                    var name = feature.attributes.NAME;

                    if(!self._nameIndexMap[name]){

                        self._nameIndexMap[name] = self._nameBegin;
                    }

                    self._nameIndexMap[name]++;

                    var color = self._colors[self._randomIndex(self._colors.length)];
                    

                    data.name = name + '-' + self._nameIndexMap[name];
                    data.FID = feature.attributes.FID;
                    data.color = color;
                    data.operation = 'add';
                    data.length = self._lengths[self._randomIndex(self._lengths.length)];
                    data.width = self._widths[self._randomIndex(self._widths.length)];
                    data.height = self._height[self._randomIndex(self._height.length)];

                    self._exsitNames.push(data.name);

                    datas.push(data);

                }else{

                    if (self._exsitNames.length != 0){
                        var index = self._randomIndex(self._exsitNames.length);
                        data.name = self._exsitNames[index];
                        data.operation = 'remove';

                        self._exsitNames.splice(index,1);

                        datas.push(data);
                    }
                }
                
            }

            
            if(cb){

                cb(datas);
            }

        },500)
    }

    this.stop = function(){

        if(this._interval){

            clearInterval(this._interval);
            this._interval = null;
            this._exsitNames=[];
        }
    }

    this.getExsitNames = function(){

        return this._exsitNames;
    }

    this._randomIndex = function(length){

        var index = Math.floor(length * Math.random());
        if(index == length){
            index--;
        }

        return index;
    }

}