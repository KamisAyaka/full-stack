import AirdropForm from "./AirdropForm";

export default function HomeContent() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-center">TSender - Token Sender</h1>
      <AirdropForm />
    </div>
  );
}
