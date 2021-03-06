var onload = require('on-load')
var assert = require('assert')

var KEY = 'ncid-' + (new Date() % 9e6).toString(36)
var INDEX = 0

module.exports = Nanocomponent

function Nanocomponent () {
  this._hasWindow = typeof window !== 'undefined'
  this._ID = KEY + '-' + INDEX++
  this._placeholder = null
  this._onload = onload
  this._element = null
  this._loaded = false
  this.props = {}
  this.oldProps = null
  this.state = {}
}

Nanocomponent.prototype._ensureID = function () {
  // Get ID - needed for nanomorph child element reordering
  var id = this._element.getAttribute('id')
  if (!id) this._element.setAttribute('id', this._ID)
  else this._ID = id
}

Nanocomponent.prototype._rerender = function (props) {
  this.oldProps = this.props
  this.props = props
  this._element = this._render()
  this._ensureID()
}

Nanocomponent.prototype.render = function (props) {
  assert.equal(typeof this._render, 'function', 'nanocomponent: this._render should be implemented')
  assert.equal(typeof this._update, 'function', 'nanocomponent: this._update should be implemented')

  var self = this
  var len = arguments.length
  var args = new Array(len)
  for (var i = 0; i < len; i++) args[i] = arguments[i]

  if (!this._hasWindow) {
    this._rerender(props)
    return this._element
  } else if (!this._element) {
    this._rerender(props)
    this._onload(this._element, function () {
      if (self._loaded) return
      self._loaded = true
      if (self._load) {
        window.requestAnimationFrame(function () {
          self._load()
        })
      }
    }, function () {
      if (document.body.contains(self._element)) return
      self._loaded = false
      if (self._unload) {
        window.requestAnimationFrame(function () {
          self._unload()
        })
      }
    })
    return this._element
  } else {
    var shouldUpdate = this._update(props)
    if (shouldUpdate) {
      this._rerender(props)
    }
    if (!this._placeholder) this._placeholder = this._createPlaceholder()
    return this._placeholder
  }
}

Nanocomponent.prototype._createPlaceholder = function () {
  var el = document.createElement('div')
  el.setAttribute('data-nanocomponent', '')
  el.setAttribute('id', this._ID)
  var self = this
  el.isSameNode = function (el) {
    return el === self._element
  }
  return el
}
