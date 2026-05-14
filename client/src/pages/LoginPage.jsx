import { Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import useAuthForm from '../hooks/useAuthForm';
import useAuth from '../hooks/useAuth';
import { login } from '../services/authService';

function LoginPage() {
  const { setSession } = useAuth();
  const { values, error, isSubmitting, handleChange, handleSubmit } = useAuthForm({
    email: '',
    password: ''
  });

  const submitLogin = handleSubmit(async () => {
    const session = await login(values);
    setSession(session);
  });

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Use your account to continue managing projects."
      submitLabel="Login"
      values={values}
      error={error}
      isSubmitting={isSubmitting}
      onChange={handleChange}
      onSubmit={submitLogin}
      footer={
        <>
          Need an account? <Link to="/register">Create one</Link>
        </>
      }
    />
  );
}

export default LoginPage;
