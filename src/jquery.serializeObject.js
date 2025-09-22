/**
 * jquery.serializeObject y evento form2json
 * v1.7
 * Autor: Yordanny Mejías V. <yordanny90@gmail.com>
 * Repositorio {@link https://github.com/yordanny90/jquery-serializeObject}
 */
/**
 * El atributo [form2json-disabled] en los fieldset e inputs, hace que se ignoren del serialize durante `$.fn.form2json`, `$.serializeMakeFormData`, `$.serializeMakeArray` y `$.serializeMakeObject`
 *
 * Se crean utilidades `$.formData_*` para la manipulación de objetos `FormData`
 */
(function(){
    /**
     * Normaliza el primer nombre de cada valor como se hace en un request nativo del navegador
     */
    var normalizeFirstName=true;
    var regex_parts=/^([^\[]+)(\[(?:.|\n|\r)*\].*)$/;
    var regex_subparts=/^\[([^\]]*)\]((?:.|\n|\r)*)$/;
    var regex_valid_name=/^[^\[]/;
    /**
     * Elimina todos los espacio/tab a la izquierda del string
     * @param {string} str
     * @returns {string}
     */
    var ltrim=function(str){
        return String(str).replace(/^[ \t]+/, '');
    };
    /**
     * Elimina solo el primer espacio/tab a la izquierda del string
     * @param {string} str
     * @returns {string}
     */
    var ltrim_one=function(str){
        return String(str).replace(/^[ \t]/, '');
    };
    var next_id=function(obj){
        var k=0;
        if(typeof obj==='object'){
            if(Array.isArray(obj)){
                k=obj.length;
            }
            else{
                k=$.extend([], obj).length;
            }
        }
        return k;
    };
    var add_recursive=function(names, value, obj){
        if(!Array.isArray(names) || names.length==0) return false;
        var k=names.shift();
        if(ltrim_one(k)===''){
            k=next_id(obj);
        }
        if(names.length==0){
            obj[k]=value;
        }
        else{
            if(typeof obj[k]!=='object'){
                obj[k]=[];
            }
            add_recursive(names, value, obj[k]);
            if(Array.isArray(obj[k]) && obj[k].length!==Object.keys(obj[k]).length){
                obj[k]=$.extend({}, obj[k]);
            }
        }
        return true;
    };
    /**
     * Convierte el nombre de un input en una lista de nombres como ruta del objeto
     * @param name
     * @returns {null|*[]}
     */
    var nameToList=function(name){
        name=ltrim(name);
        if(!(name.match(regex_valid_name))) return null;
        var parts;
        var names=[];
        if(parts=name.match(regex_parts)){
            if(normalizeFirstName){
                parts[1]=parts[1].replace(/[ \[]/g, '_');
            }
            names.push(parts[1]);
            var subpart=parts[2];
            while(parts=subpart.match(regex_subparts)){
                names.push(parts[1]);
                subpart=parts[2];
            }
        }
        else{
            if(normalizeFirstName){
                // Se normaliza según el primer caracter en encontrarse (' ' o '[')
                if(parts=name.match(/([ \[])/)){
                    if(parts[1]==' '){
                        name=name.replace(/[ \[]/g, '_');
                    }
                    else if(parts[1]=='['){
                        name=name.replace(/\[/g, '_');
                    }
                }
            }
            names.push(name);
        }
        return names;
    };
    var add_form_item=function(name, value, obj){
        if(typeof name!=="string" || typeof value==="undefined"){
            return false;
        }
        var names=nameToList(name);
        if(!names) return false;
        add_recursive(names, value, obj);
        return true;
    };
    /**
     * Transfiere los datos de un FormData a un objeto
     * @param {FormData} fdata Objeto FormData de donde se leen los datos
     * @returns {null|object} Objeto resultado al que se agregaron los datos
     */
    var formData_getObject=function(fdata){
        if(!(fdata instanceof FormData)) return null;
        var obj={};
        $.each(Array.from(fdata.entries()), function(i, e){
            if(!(e[1] instanceof Object)){
                add_form_item(e[0], e[1], obj);
            }
        });
        return obj;
    };
    /**
     * Transfiere los datos de un FormData a un objeto
     * @param {FormData} fdata Objeto FormData de donde se leen los datos
     * @returns {*[]|null} Array al que se agregaron los datos
     */
    var formData_getArray=function(fdata){
        if(!(fdata instanceof FormData)) return null;
        var arr=[];
        $.each(Array.from(fdata.entries()), function(i, e){
            if(!(e[1] instanceof Object)){
                arr.push({
                    name: e[0],
                    value: e[1]
                });
            }
        });
        return arr;
    };
    /**
     * Transfiere los archivos de un FormData a un nuevo FormData
     * @param {FormData} fdata Objeto FormData de donde se leen los datos
     * @returns {*[]|null} Array al que se agregaron los archivos
     */
    var formData_getFiles=function(fdata){
        if(!(fdata instanceof FormData)) return null;
        var arr=[];
        $.each(Array.from(fdata.entries()), function(i, e){
            if((e[1] instanceof File)){
                arr.push({
                    name: e[0],
                    value: e[1]
                });
            }
        });
        return arr;
    };

    var default_json_name='__dataJSON__';

    /**
     * Transfiere los datos de un FormData a un archivo JSON.<br>
     * Los archivos y los datos convertidos en un JSON se transfieren al nuevo FormData
     * @param {FormData} fdata Objeto FormData de donde se leen los datos
     * @param {null|string} name Default: `'__dataJSON__'`. Nombre (input) con el que se envía el archivo JSON con todos los datos.
     * @returns {null|FormData} Nuevo FormData
     */
    var formData_intoJSONFile=function(fdata, name){
        if(!(fdata instanceof FormData)) return null;
        if(name==null || (name=String(name))==='') name=default_json_name;
        var fd=formData_fromArray(formData_getFiles(fdata));
        var data=JSON.stringify(formData_getObject(fdata));
        var json_file=new File([data], 'data.json', {type: "text/json"});
        fd.append(name, json_file);
        return fd;
    };
    /**
     * Transfiere los datos de un FormData a un input JSON.<br>
     * Los archivos y los datos convertidos en un JSON se transfieren al nuevo FormData
     * @param {FormData} fdata Objeto FormData de donde se leen los datos
     * @param {null|string} name Default: `'__dataJSON__'`. Nombre del input al que se agrega el JSON con todos los datos
     * @returns {null|FormData} Nuevo FormData
     */
    var formData_intoJSON=function(fdata, name){
        if(!(fdata instanceof FormData)) return null;
        if(name==null || (name=String(name))==='') name=default_json_name;
        var fd=formData_fromArray(formData_getFiles(fdata));
        var data=JSON.stringify(formData_getObject(fdata));
        fd.append(name, data);
        return fd;
    };
    /**
     * Genera una FormData a partir de un array de datos
     * @param {[]|{}} arr La estructura debe ser: ```
     * [
     *  {
     *      "name":"a",
     *      "value":"a"
     *  },
     *  {
     *      "name":"b",
     *      "value":"b"
 *      }
     * ]```
     * @param {FormData|null} fdata A eset FormData se agregan los nuevos datos. Si no es un FormData se crea uno nuevo
     * @returns {FormData}
     */
    var formData_fromArray=function(arr, fdata){
        if(!(fdata instanceof FormData)) fdata=new FormData();
        if(typeof arr==="object"){
            $.each(Array.from(arr), function(i, e){
                if((typeof e!=="object") || (typeof e.name!=="string") || e.name==='') return;
                if((e.value instanceof File) || (typeof e.value==="string") || (typeof e.value==="number")){
                    fdata.append(e.name, e.value);
                }
            });
        }
        return fdata;
    }
    /**
     * Retorna varios objetos FormData combinados en uno solo. Si el primer elemento es un FormData, a ese se agregaran los siguientes FormData
     * @param {FormData} mainFD A este FormData se agregarán los datos de los demás. Si no se recibe, se creará un nuevo FormData
     * @param {...FormData} _
     * @returns {FormData}
     */
    var formData_merge=function(mainFD, ..._){
        if(!(mainFD instanceof FormData)) mainFD=new FormData();
        $.each(_, function(i, fd){
            if(!(fd instanceof FormData)) return;
            $.each(Array.from(fd.entries()), function(i, e){
                mainFD.append(e[0], e[1]);
            });
        });
        return mainFD;
    };
    /**
     * Obtiene todos los elementos (inputs y fieldset) del selector.
     * Incluye los encontrados diractamente con el selector, como los obtenidos de la propiedad `elements` de los form y fieldset en el selector
     * @param {jQuery|HTMLElement[]} sel
     * @returns {jQuery}
     */
    var getElements=function(sel){
        var res=$(sel).map(function(i, e){
            if($(e).is('form,fieldset')) return $(e.elements).get();
            else if($(e).is(':input')) return e;
        });
        // Elimina los repetidos del conjunto y genera un nuevo objeto jQuery
        res=$(res.add().get());
        return res;
    };
    /**
     * @param {jQuery|HTMLFormElement|HTMLFieldSetElement} form Nodo form/fieldset
     * @param {Function} fn Función en la que el `this` es el conjunto de inputs del form/fieldset
     */
    var applyDisabled=function(form, fn){
        var el=getElements(form).filter(':enabled');
        var ignore=el.filter('[form2json-disabled]');
        ignore.prop('disabled', true);
        try{
            fn.call(el.filter(':input'));
        }
        catch(err){
            console.error(err);
        }
        finally{
            ignore.prop('disabled', false);
        }
    }

    window.serializeObject_util={
        ltrim: ltrim,
        ltrim_one: ltrim_one,
        next_id: next_id,
        add_recursive: add_recursive,
        nameToList: nameToList,
        add_form_item: add_form_item,
        getElements: getElements,
    };
    $.extend($.fn, {
        /**
         * Hace los mismo que jQuery.fn.serializeArray, pero con los datos se construye un objeto
         * @returns {{}}
         */
        serializeObject: function(){
            var obj={};
            $.each($(this).serializeArray(), function(i, e){
                add_form_item(e['name'], e['value'], obj);
            });
            return obj;
        },
        /**
         * Hace los mismo que jQuery.fn.serializeArray, pero con la lista de archivos
         * @returns {{}}
         */
        serializeFiles: function(){
            var files=getElements(this).filter('[name]:file:enabled');
            var arr=[];
            $.each(files, function(i, e){
                if(e.name==null || e.name==='' || !e.files) return;
                $.each(e.files, function(i, f){
                    arr.push({
                        name: e.name,
                        value: f,
                    });
                });
            });
            return arr;
        },
        /**
         * @returns {jQuery}
         */
        form2json: function(){
            return $(this).trigger('form2json');
        },
        /**
         * Genera un FormData para el form/fieldset
         * @param {bool} trigger_form2son Default: TRUE. Si es FALSE, no ejecuta el evento `form2json`
         * @param {bool} exclude_files
         * @returns {FormData|null}
         */
        serializeMakeFormData: function(trigger_form2son, exclude_files){
            var t=$(this).first();
            if(t.length==0 || !t.is('form,fieldset')) return null;
            if(trigger_form2son==null || trigger_form2son) t.form2json();
            var fd=null;
            applyDisabled(t, function(){
                fd=formData_fromArray($(this).serializeArray());
                if(!exclude_files){
                    fd=formData_fromArray($(this).serializeFiles(), fd);
                }
            });
            return fd;
        },
        /**
         * Genera un Objeto para el form/fieldset
         * @param {bool} trigger_form2son Default: TRUE. Si es FALSE, no ejecuta el evento `form2json`
         * @returns {Object|null}
         */
        serializeMakeArray: function(trigger_form2son){
            var t=$(this).first();
            if(t.length==0 || !t.is('form,fieldset')) return null;
            if(trigger_form2son==null || trigger_form2son) t.form2json();
            var fd=null;
            applyDisabled(t, function(){
                fd=$(this).serializeArray();
            });
            return fd;
        },
        /**
         * Genera un Objeto para el form/fieldset
         * @param {bool} trigger_form2son Default: TRUE. Si es FALSE, no ejecuta el evento `form2json`
         * @returns {Object|null}
         */
        serializeMakeObject: function(trigger_form2son){
            var t=$(this).first();
            if(t.length==0 || !t.is('form,fieldset')) return null;
            if(trigger_form2son==null || trigger_form2son) t.form2json();
            var fd=null;
            applyDisabled(t, function(){
                fd=$(this).serializeObject();
            });
            return fd;
        },
    });
    $.extend($, {
        serializeObject_util: serializeObject_util,
        formData_getObject,
        formData_getArray,
        formData_getFiles,
        formData_intoJSONFile,
        formData_intoJSON,
        formData_fromArray,
        formData_merge,
    });

    /**
     * Atributo y evento `form2json`
     */
    var startForm2Json=function(form, event, locked){
        if(!locked) locked=$();
        var form=$(form);
        if(form.is('fieldset')){
            var p=form.parentsUntil('form','fieldset').last();
            if(p.length) form=p;
        }
        if(locked.filter(form).length) return;
        locked=locked.add(form);
        try{
            var list={};
            var inputs=getElements(form).filter('[form2json]:input').not('[form2json=""]');
            inputs.each(function(i, e){
                var id=$(e).attr('form2json');
                if(!list[id]){
                    list[id]={
                        form: document.getElementById(id),
                        inputs: [],
                    };
                }
                list[id].inputs.push(e);
            });
            inputs.val('');
            $.each(list, function(i, obj){
                var f2j=$(obj.form).filter('form,fieldset');
                var sets=$(obj.inputs);
                if(!f2j.length || !sets.length) return;
                try{
                    locked=startForm2Json(f2j, event, locked)||locked;
                    sets=sets.filter(function(i, e){
                        return e.value=='';
                    });
                    if(sets.length){
                        sets.val(JSON.stringify(f2j.serializeMakeObject(false)));
                    }
                }catch(e){
                    console.error(e);
                }
            });
            var missing=inputs.filter(function(i, e){
                return e.value=='';
            });
            if(missing.length){
                console.debug('missing', missing);
            }
        }
        catch(e){
            console.error(e);
        }
        return locked;
    };
    var form2json_input=function(el){
        el=$(el);
        var formID=el.attr('form2json');
        if(formID==null || formID==='') return;
        el.val('');
        var form=$(document.getElementById(formID));
        if(form.is('form,fieldset')) return form;
    }
    $(document).on('submit', 'form', function(event){
        $(this).form2json();
    });
    $(document).on('form2json', 'form', function(event){
        var locked=startForm2Json(this, event);
        // console.debug('locked', locked);
    });
    $(document).on('form2json-fieldset', 'fieldset', function(event){
        event.stopPropagation();
        var locked=startForm2Json(this, event);
        // console.debug('locked', locked);
    });
    $(document).on('form2json-input',':input[form2json]', function(event){
        var form=form2json_input(this);
        if(form){
            var locked=startForm2Json(form, event);
            // console.debug('locked', locked);
        }
    });
})();