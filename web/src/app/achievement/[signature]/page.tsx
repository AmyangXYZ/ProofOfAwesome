export default function Page({ params }: { params: { signature: string } }) {
  return <p>Achievement: {params.signature}</p>
}
