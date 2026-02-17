export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Attendance | YEHA</title>
      <meta name="description" content="Track and manage attendance for all groups." />
      <meta name="robots" content={robots} />
    </>
  );
}
