import SubsidyProgramDetail from './SubsidyProgramDetail';

export default function SubsidyProgramDetailPage({ params }: { params: { id: string } }) {
  return <SubsidyProgramDetail subsidyProgramId={params.id} />;
}