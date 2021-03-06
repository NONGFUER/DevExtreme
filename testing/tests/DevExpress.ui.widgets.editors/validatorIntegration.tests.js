"use strict";

var $ = require("jquery"),
    Class = require("core/class"),
    ValidationEngine = require("ui/validation_engine"),
    Validator = require("ui/validator"),
    keyboardMock = require("../../helpers/keyboardMock.js");

require("common.css!");
require("generic_light.css!");
require("ui/text_box");
require("ui/date_box");
require("ui/number_box");

var Fixture = Class.inherit({
    createInstance: function(editor, editorOptions, validatorOptions) {
        var $element = $("<div/>")[editor](editorOptions).dxValidator(validatorOptions);
        this.$element = $element;

        this.$input = $element.find(".dx-texteditor-input");

        this.keyboard = keyboardMock(this.$input);
        this.editor = $element[editor]("instance");
        this.validator = Validator.getInstance($element);

        return $element;
    },

    createTextBoxWithValidator: function(validatorOptions) {
        this.$element = $("<div/>");
        var validator = this.$element.dxTextBox().dxValidator(validatorOptions).dxValidator("instance");
        return validator;
    },

    teardown: function() {
        this.$element.remove();
        ValidationEngine.initGroups();
    }
});



(function() {
    QUnit.module("Regression", {
        beforeEach: function() {
            this.fixture = new Fixture();
        },
        afterEach: function() {
            this.fixture.teardown();
        }
    });

    QUnit.test("dateBox and Validator", function(assert) {
        this.fixture.createInstance("dxDateBox", { pickerType: "calendar" }, { validationRules: [{ type: "required" }] });

        this.fixture.keyboard.type("somethingwrong");
        this.fixture.$input.trigger("change");

        assert.strictEqual(this.fixture.editor.option("isValid"), false, "Editor should be invalid because incorrect date was typed");
        var editorValidationError = this.fixture.editor.option("validationError");
        assert.ok(editorValidationError, "Editor should have specific validation error");
        assert.ok(editorValidationError.editorSpecific, "editorSpecific flag");
    });

    QUnit.test("T197118: dateBox and Validator simultaneous validation", function(assert) {
        this.fixture.createInstance("dxDateBox", { pickerType: "calendar" }, { validationRules: [{ type: "required" }] });

        this.fixture.keyboard.type("somethingwrong");
        this.fixture.$input.trigger("change");
        //action
        //validate Validator which is associated with Editor that is not ready for official validation
        this.fixture.validator.validate();

        assert.strictEqual(this.fixture.editor.option("isValid"), false, "Editor should be invalid because incorrect date was typed");
        var editorValidationError = this.fixture.editor.option("validationError");
        assert.ok(editorValidationError, "Editor should have specific validation error");
        assert.ok(editorValidationError.editorSpecific, "editorSpecific flag");
    });

    QUnit.test("T197157: dateBox and Validator - validation with wrong-typed date", function(assert) {
        this.fixture.createInstance("dxDateBox", { pickerType: "calendar" }, { validationRules: [{ type: "required" }] });

        this.fixture.keyboard.type("somethingwrong");
        this.fixture.$input.trigger("change");
        this.fixture.validator.validate();

        this.fixture.$input.val("");
        //action
        //this should cause validation, and now - as empty string is "acceptable" date/time string for NULL date - it should result in "Required" validation
        this.fixture.$input.trigger("change");

        assert.strictEqual(this.fixture.editor.option("isValid"), false, "Editor should be invalid because incorrect date was typed");
        var editorValidationError = this.fixture.editor.option("validationError");
        assert.ok(editorValidationError, "Editor should have specific validation error");
        assert.strictEqual(editorValidationError.editorSpecific, undefined, "editorSpecific flag should not be set");
        assert.strictEqual(editorValidationError.message, "Required", "Message should came from dxValidator");
    });

    QUnit.test("T260652: disabled widgets should not be validated", function(assert) {
        this.fixture.createInstance("dxTextBox", { value: "", disabled: true }, { validationRules: [{ type: "required" }] });

        var result = this.fixture.validator.validate();

        assert.strictEqual(result.isValid, true, "Disabled widget should bypass validation");
    });

    QUnit.test("T426721: dxValidator text jumps during validation", function(assert) {
        var validator = this.fixture.createTextBoxWithValidator({ validationRules: [{ type: "required" }] });
        var textBox = this.fixture.$element.dxTextBox("instance");

        try {
            this.fixture.$element.appendTo("#qunit-fixture");

            textBox.option("templatesRenderAsynchronously", true);

            validator.validate();

            var $overlayWrapper = validator.element().find(".dx-overlay-wrapper");

            assert.equal($overlayWrapper.length, 1, "validation message not blinking on render");
        } finally {
            this.fixture.$element.remove();
        }
    });

    QUnit.test("Validator message does not detached when parent scrolled", function(assert) {
        var validator = this.fixture.createTextBoxWithValidator({ validationRules: [{ type: "required" }] }),
            topDiff = 22;

        $("<div style='height: 100px'/>").insertAfter(
            this.fixture.$element.wrap("<div id='bingo' style='overflow-y: scroll; height: 100px' />")
        );
        var $scrollableWrapper = validator.element().parent().appendTo("body");

        validator.validate();

        var top1 = validator.element().find(".dx-overlay").offset().top;
        $scrollableWrapper.scrollTop(topDiff);
        var top2 = validator.element().find(".dx-overlay").offset().top;

        assert.roughEqual(top1 - top2 - topDiff, 0, 0.01, "message overlay was not detached from input");
    });

    QUnit.test("NumberBox and Validator", function(assert) {
        this.fixture.createInstance("dxNumberBox", { }, { validationRules: [{ type: "required" }] });

        this.fixture.editor.option("value", "asd");

        assert.strictEqual(this.fixture.editor.option("isValid"), false, "Editor should be invalid because of empty value");

        var editorValidationError = this.fixture.editor.option("validationError");
        assert.ok(editorValidationError, "Editor should have specific validation error");
        assert.ok(editorValidationError.editorSpecific, "editorSpecific flag");
    });

    QUnit.test("NumberBox and Validator with the 'required' rule (T368398)", function(assert) {
        this.fixture.createInstance("dxNumberBox", { }, { validationRules: [{ type: "required" }] });

        this.fixture.validator.validate();
        this.fixture.$input.val("1").trigger("change");
        this.fixture.$input.val("").trigger("change");

        assert.strictEqual(this.fixture.editor.option("isValid"), false, "Editor should be invalid because of empty value");
    });
})("Regression");
