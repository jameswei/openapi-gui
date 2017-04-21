Vue.component('api-parameter', {
	props: ['parameter', 'index'],
    computed: {

        hashUid : function() {
            return '#'+this._uid;
        },

        formatListId : function() {
            return 'listFormats'+this._uid;
        },

        effectiveType : {
            get : function() {
                if (!this.parameter.type) return 'object';
                return this.parameter.type;
            },
            set : function(newVal) {
                if (newVal == 'array') {
                    var items = {};
                    items.schema = this.parameter.schema;
                    Vue.set(this.parameter, 'items', items);
                }
                else {
                    Vue.set(this.parameter, 'schema', this.parameter.items.schema);
                    Vue.delete(this.parameter, 'items');
                }
                this.parameter.type = newVal;
            }
        },

        effectiveIn : {
            get : function() {
                if (!this.parameter.in) return 'body';
                return this.parameter.in;
            },
            set : function(newVal) {
                this.parameter.in = newVal;
				if (newVal == 'path') Vue.set(this.parameter, 'required', true);
            }
        },

        effectiveRequired : {
            get : function() {
                if (typeof this.parameter.required === 'undefined') return false;
                return this.parameter.required;
            },
            set : function(newVal) {
                this.parameter.required = newVal;
            }
        },

        effectiveFormats : {
            get : function() {
                if (this.parameter.type == 'integer') return ['int32','int64'];
                if (this.parameter.type == 'number') return ['float','double'];
                if (this.parameter.type == 'string') return ['date','date-time','byte','binary','password'];
                return [];
            },
            set : function(newVal) {}
        }

    },
	data: function() {
		return {
            visible: false,
            schemaEditor: undefined
        }
	},
    methods : {
        toggleBody : function() {
            this.visible = !this.visible;
            $(this.hashUid).collapse('toggle');
        },
        isComplex : function() {
            if (this.effectiveType === 'object' ||
                this.effectiveType === 'array' ||
                this.effectiveType === 'file') {
               return true;
            }
            return false;
        },
        addParameter : function() {
            this.$parent.addParameter();
        },
        removeParameter : function() {
            this.$parent.removeParameter(this.index);
        },
        editSchema : function() {
            if (!this.parameter.schema) {
                Vue.set(this.parameter, 'schema', {});
            }
            var initial = deref(this.parameter.schema, this.$root.container.openapi);
            var editorOptions = {
                theme: 'bootstrap2',
                iconlib: 'fontawesome4',
                display_required_only: true,
                schema: jsonSchemaDraft4,
                refs: this.$root.container.openapi,
                startval: initial
            };
            var element = document.getElementById('schemaContainer');
            this.schemaEditor = new JSONEditor(element, editorOptions);
            schemaEditorClose = function() {
                this.schemaEditor.destroy();
                $('#schemaModal').modal('hide');
            }.bind(this);
            schemaEditorSave = function() {
                this.parameter.schema = this.schemaEditor.getValue();
                schemaEditorClose();
            }.bind(this);
            var modalOptions = {};
            $('#schemaModal').modal(modalOptions);
        },
        addEnum : function() {
            if (!this.parameter.enum) {
                Vue.set(this.parameter, 'enum', []);
            }
            this.parameter.enum.push('newValue');
        },
        removeEnum : function(index) {
            this.parameter.enum.splice(index, 1);
        }
    },
	template: '#template-parameter',
    beforeMount : function() {
        if (this.parameter["$ref"]) {
            var ptr = this.parameter["$ref"].substr(1); // remove #
            try {
                var def = new JSONPointer(ptr).get(this.$root.container.openapi);
                for (var p in def) {
                    this.parameter[p] = def[p];
                }
                delete this.parameter["$ref"];
            }
            catch (ex) {
                this.$root.showAlert('Could not find $ref '+this.parameter["$ref"]);
            }
        }
    }
});
