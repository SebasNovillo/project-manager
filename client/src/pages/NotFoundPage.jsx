import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The route does not exist yet. Return to the dashboard to keep building.</p>
      <Link to="/" className="primary-button">
        Go home
      </Link>
    </main>
  );
}

export default NotFoundPage;

