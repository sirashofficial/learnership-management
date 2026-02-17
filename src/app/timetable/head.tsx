export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Timetable | YEHA</title>
      <meta name="description" content="Schedule sessions and view upcoming training." />
      <meta name="robots" content={robots} />
    </>
  );
}
