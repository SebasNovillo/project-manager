import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function useAuthForm(initialValues) {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setError('');
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleSubmit = (submitAction) => async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError('');
      await submitAction();
      navigate('/');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    error,
    isSubmitting,
    handleChange,
    handleSubmit
  };
}

export default useAuthForm;
