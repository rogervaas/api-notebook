/* global describe, it */

describe('Result Cell', function () {
  var Result    = App.View.ResultCell;
  var fixture = document.getElementById('fixture');

  it('should exist', function () {
    expect(Result).to.be.a('function');
  });

  describe('Result Cell instance', function () {
    var view;

    beforeEach(function () {
      view = new Result();
    });

    it('should have a class', function () {
      expect(view.el.className).to.contain('cell');
      expect(view.el.className).to.contain('cell-result');
      expect(view.el.className).to.contain('result-pending');
    });

    describe('#setResult', function () {
      it('should set the result', function () {
        view.setResult('Testing');

        expect(view.el.className).to.not.contain('result-error');
        expect(view.el.className).to.not.contain('result-pending');
      });
    });

    describe('#setError', function () {
      it('should set the error', function () {
        view.setError(new Error('Testing'));

        expect(view.el.className).to.contain('result-error');
        expect(view.el.className).to.not.contain('result-pending');
      });
    });
  });
});