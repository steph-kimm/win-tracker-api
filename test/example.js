process.env.TESTENV = true

let Win = require('../app/models/win.js')
let User = require('../app/models/user')

const crypto = require('crypto')

let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
chai.should()

chai.use(chaiHttp)

const token = crypto.randomBytes(16).toString('hex')
let userId
let exampleId

describe('Wins', () => {
  const exampleParams = {
    title: '13 JavaScript tricks SEI instructors don\'t want you to know',
    text: 'You won\'believe number 8!'
  }

  before(done => {
    Win.deleteMany({})
      .then(() => User.create({
        email: 'caleb',
        hashedPassword: '12345',
        token
      }))
      .then(user => {
        userId = user._id
        return user
      })
      .then(() => Win.create(Object.assign(exampleParams, {owner: userId})))
      .then(record => {
        exampleId = record._id
        done()
      })
      .catch(console.error)
  })

  describe('GET /wins', () => {
    it('should get all the wins', done => {
      chai.request(server)
        .get('/wins')
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.wins.should.be.a('array')
          res.body.wins.length.should.be.eql(1)
          done()
        })
    })
  })

  describe('GET /wins/:id', () => {
    it('should get one win', done => {
      chai.request(server)
        .get('/wins/' + exampleId)
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.win.should.be.a('object')
          res.body.win.title.should.eql(exampleParams.title)
          done()
        })
    })
  })

  describe('DELETE /wins/:id', () => {
    let exampleId

    before(done => {
      Win.create(Object.assign(exampleParams, { owner: userId }))
        .then(record => {
          exampleId = record._id
          done()
        })
        .catch(console.error)
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .delete('/wins/' + exampleId)
        .set('Authorization', `Bearer notarealtoken`)
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should be succesful if you own the resource', done => {
      chai.request(server)
        .delete('/wins/' + exampleId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 if the resource doesn\'t exist', done => {
      chai.request(server)
        .delete('/wins/' + exampleId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('POST /wins', () => {
    it('should not POST an win without a title', done => {
      let noTitle = {
        text: 'Untitled',
        owner: 'fakedID'
      }
      chai.request(server)
        .post('/wins')
        .set('Authorization', `Bearer ${token}`)
        .send({ win: noTitle })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not POST an example without text', done => {
      let noText = {
        title: 'Not a very good example, is it?',
        owner: 'fakeID'
      }
      chai.request(server)
        .post('/wins')
        .set('Authorization', `Bearer ${token}`)
        .send({ win: noText })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not allow a POST from an unauthenticated user', done => {
      chai.request(server)
        .post('/wins')
        .send({ win: exampleParams })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should POST an example with the correct params', done => {
      let validExample = {
        title: 'I ran a shell command. You won\'t believe what happened next!',
        text: 'it was rm -rf / --no-preserve-root'
      }
      chai.request(server)
        .post('/wins')
        .set('Authorization', `Bearer ${token}`)
        .send({ win: validExample })
        .end((e, res) => {
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('example')
          res.body.win.should.have.property('title')
          res.body.win.title.should.eql(validExample.title)
          done()
        })
    })
  })

  describe('PATCH /wins/:id', () => {
    let exampleId

    const fields = {
      title: 'Find out which HTTP status code is your spirit animal',
      text: 'Take this 4 question quiz to find out!'
    }

    before(async function () {
      const record = await Win.create(Object.assign(exampleParams, { owner: userId }))
      exampleId = record._id
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .patch('/wins/' + exampleId)
        .set('Authorization', `Bearer notarealtoken`)
        .send({ win: fields })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should update fields when PATCHed', done => {
      chai.request(server)
        .patch(`/wins/${exampleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ win: fields })
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('shows the updated resource when fetched with GET', done => {
      chai.request(server)
        .get(`/wins/${exampleId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.win.title.should.eql(fields.title)
          res.body.win.text.should.eql(fields.text)
          done()
        })
    })

    it('doesn\'t overwrite fields with empty strings', done => {
      chai.request(server)
        .patch(`/wins/${exampleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ win: { text: '' } })
        .then(() => {
          chai.request(server)
            .get(`/wins/${exampleId}`)
            .set('Authorization', `Bearer ${token}`)
            .end((e, res) => {
              res.should.have.status(200)
              res.body.should.be.a('object')
              // console.log(res.body.example.text)
              res.body.win.title.should.eql(fields.title)
              res.body.win.text.should.eql(fields.text)
              done()
            })
        })
    })
  })
})
