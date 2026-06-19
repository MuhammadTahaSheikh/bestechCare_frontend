import { GoogleLogin } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../config';

export default function GoogleSignInButton({ onSuccess, onError, disabled = false }) {
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className={`google-signin${disabled ? ' google-signin-disabled' : ''}`}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="360"
        locale="en"
        useOneTap={false}
        containerProps={{ className: 'google-signin-btn' }}
      />
    </div>
  );
}
