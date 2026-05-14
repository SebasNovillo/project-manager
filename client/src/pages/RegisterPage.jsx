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
    password: '',
    confirmPassword: ''
  });

  const submitRegister = handleSubmit(async () => {
    if (values.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (values.password !== values.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const session = await register({
      name: values.name,
      email: values.email,
      password: values.password
    });
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
