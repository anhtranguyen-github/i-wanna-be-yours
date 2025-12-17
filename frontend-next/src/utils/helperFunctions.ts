// utils/getUserFromCookies.js

import Cookies from 'js-cookie';

// Function to get user and JWT from cookies, providing dummy values if not found
export const getUserFromCookies = () => {
  // Retrieve the hanachan_user and hanachan_jwt from cookies
  const userName = Cookies.get('hanachan_userName') || 'dummyuserName';
  const userId = Cookies.get('hanachan_userId') || 'dummyuserId';
  const jwt = Cookies.get('hanachan_jwt') || 'dummy.JWT.token';

  console.log('User Name:', userName);
  console.log('User ID:', userId);
  console.log('JWT:', jwt);

  // Return the user and jwt token
  return { userName, userId, jwt };
};
