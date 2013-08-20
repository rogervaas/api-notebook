var _           = require('underscore');
var marked      = require('marked');
var domify      = require('domify');
var Backbone    = require('backbone');
var EditorCell  = require('./editor');
var stripInput  = require('../../lib/cm-strip-input');
var insertAfter = require('../../lib/insert-after');

var TextCell = module.exports = EditorCell.extend({
  className: 'cell cell-text'
});

TextCell.prototype.events = _.extend({}, EditorCell.prototype.events, {
  'click': 'focus'
});

TextCell.prototype.EditorModel = require('../../models/text-entry');

TextCell.prototype.editorOptions = _.extend(
  {},
  EditorCell.prototype.editorOptions,
  {
    mode: 'gfm',
    theme: 'text-cell'
  }
);

TextCell.prototype.closeCell = function (code) {
  this.trigger('code', this, code);
  this.el.classList.add('text-closed');
};

TextCell.prototype.bindEditor = function () {
  EditorCell.prototype.bindEditor.call(this);

  this.listenTo(this.editor, 'change', _.bind(function (cm, data) {
    var endCommentBlock = stripInput('*/', cm, data);
    if (endCommentBlock !== false) { this.closeCell(endCommentBlock); }
  }, this));

  // This whole functionality needs a rewrite once we merge with the server-side
  // code since I imagine there won't be any need for an editor if we don't own
  // the notebook and can't edit it.
  this.listenTo(this.editor, 'blur', _.bind(function () {
    this.hasFocus = false;
    this.renderEditor();
  }, this));

  return this;
};

TextCell.prototype.focus = function () {
  // Don't actually allow focusing on the editor if the user is not authorized
  if (this.notebook && !this.notebook.isOwner()) { return this; }

  this.hasFocus = true;
  this.renderEditor();
  this.editor.focus();
  return this;
};

TextCell.prototype.setValue = function (value) {
  if (this.editor) {
    return EditorCell.prototype.setValue.apply(this, arguments);
  }

  // Rerender markdown cell
  this.model.set('value', value);
  return this.renderMarkdown();
};

TextCell.prototype.renderMarkdown = function () {
  this.removeMarkdown();

  this.markdownElement = this.el.insertBefore(
    domify('<div class="markdown"></div>'), this.el.firstChild
  );

  _.each(this.el.getElementsByClassName('comment'), function (el) {
    el.style.display = 'none';
  });

  marked(this.getValue(), {
    gfm: true,
    // highlight: function () {},
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false,
    langPrefix: 'lang-'
  }, _.bind(function (err, html) {
    try {
      html = domify(html);
    } catch (e) {
      html = document.createTextNode(html);
    }

    this.markdownElement.appendChild(html);
  }, this));

  return this;
};

TextCell.prototype.removeMarkdown = function () {
  if (this.markdownElement) {
    this.markdownElement.parentNode.removeChild(this.markdownElement);

    _.each(this.el.getElementsByClassName('comment'), function (el) {
      el.style.display = 'block';
    });

    delete this.markdownElement;
  }

  return this;
};

TextCell.prototype.renderEditor = function () {
  if (this.hasFocus) {
    this.removeMarkdown();
    EditorCell.prototype.renderEditor.call(this);
  } else {
    this.removeEditor();
    this.renderMarkdown();
  }

  return this;
};

TextCell.prototype.render = function () {
  EditorCell.prototype.render.call(this);

  this.el.appendChild(domify('<div class="comment comment-open">/*</div>'));
  this.el.appendChild(domify('<div class="comment comment-close">*/</div>'));

  return this;
};
