import { profile } from '@/content/profile';
import { CvSheet } from '@/cv/CvSheet';
import { CvToolbar } from '@/cv/CvToolbar';

export default function CvPage() {
  return (
    <>
      <CvToolbar />
      <CvSheet profile={profile} />
    </>
  );
}
