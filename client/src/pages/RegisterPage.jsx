import { Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import useAuthForm from '../hooks/useAuthForm';
import useAuth from '../hooks/useAuth';
import { register } from '../services/authService';

function RegisterPage() {
  const { setSession } = useAuth();
  const { values, error, isSubmitting, handleChange, handleSubmit } = useAuthForm({
    name: '',
    email: '',
    password: ''
  });

  const submitRegister = handleSubmit(async () => {
    const session = await register(values);
    setSession(session);
  });

  return (
    <AuthForm
      title="Create your account"
      subtitle="Start with a clean setup for projects, columns, and tasks."
      submitLabel="Register"
      values={values}
      error={error}
      isSubmitting={isSubmitting}
      onChange={handleChange}
      onSubmit={submitRegister}
      footer={
        <>
          Already registered? <Link to="/login">Sign in</Link>
        </>
      }
    />
  );
}

export default RegisterPage;
