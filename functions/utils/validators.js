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

const validateUserDetails = data => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) {
    userDetails.bio = data.bio.trim();
  }

  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `https://${data.website.trim()}`;
    } else {
      userDetails.website = data.website.trim();
    }
  }

  if (!isEmpty(data.location.trim())) {
    userDetails.location = data.location.trim();
  }

  return userDetails;
};

module.exports = {
  validateSignUpData,
  validateSignInData,
  validateUserDetails
};
