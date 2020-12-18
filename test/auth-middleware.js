const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const expect = require('chai').expect;
const authMiddleware = require('../middleware/isAuth');

describe('Auth middleware', function() {
    it('should throw an error if there is no authorization header', function () {
        const req = {
            get: function(headerName) {
                return null;
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('Not authenticated');
    });

    it('should throw an error if the authorization header is only one string', function () {
        const req = {
            get: function (headerName) {
                return 'xyz';
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
    });

    it('should throw an error if the token cannot be verified', function () {
        const req = {
            get: function (headerName) {
                return 'Bearer xyz';
            }
        };
        expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
    });

    it('should yield a userId after decoding the token', function () {
        const req = {
            get: function (headerName) {
                return 'Bearer afdasffsdasfda';
            }
        };
        sinon.stub(jwt, 'verify');
        jwt.verify.returns({userId: 'abc'});
        /*jwt.verify = function () {
            return { userId : 'abc' };
        }*/
        authMiddleware(req, {}, () => {});
        expect(req).to.have.property('userId') ;
        expect(req).to.have.property('userId', 'abc');
        expect(jwt.verify.called).to.be.true;
        jwt.verify.restore();
    });
});