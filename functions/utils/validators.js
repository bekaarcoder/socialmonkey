const { isEmpty, isEmail } = require("../helpers/helpers");

const validateSignUpData = data => {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Email must be valid";
  }

  if (isEmpty(data.password)) {
    errors.password = "Password must not be empty";
  }

  if (isEmpty(data.confirmPass)) {
    errors.confirmPass = "Confirm Password must not be empty";
  } else if (data.password !== data.confirmPass) {
    errors.confirmPass = "Password must be same";
  }

  if (isEmpty(data.handle)) {
    errors.handle = "Handle must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

const validateSignInData = data => {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Email address must be valid";
  }

  if (isEmpty(data.password)) {
    errors.password = "Password must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

module.exports = { validateSignUpData, validateSignInData };
