export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>User Management | YEHA</title>
      <meta name="description" content="Manage users, roles, and permissions." />
      <meta name="robots" content={robots} />
    </>
  );
}
