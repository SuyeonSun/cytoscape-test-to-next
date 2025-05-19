import ExpandableGraph from "../test/ExpandableGraph";

const sampleData = [
  {
    id: "team1",
    label: "Engineering",
    children: [
      { id: "dev1", label: "Frontend Dev" },
      { id: "dev2", label: "Backend Dev" },
    ],
  },
  {
    id: "team2",
    label: "Design",
    children: [{ id: "design1", label: "UX Designer" }],
  },
];

export default function TestPage2() {
  return (
    <>
      <p>Test Page2</p>
      <ExpandableGraph sampleData={sampleData} />
    </>
  );
}
