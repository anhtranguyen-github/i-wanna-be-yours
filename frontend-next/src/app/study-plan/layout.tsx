import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Study Plan - Hanabira.org',
    description: 'Create your personalized JLPT study plan. Set a target level, exam date, and receive adaptive milestones and daily tasks.',
    keywords: ['JLPT', 'study plan', 'Japanese', 'N5', 'N4', 'N3', 'N2', 'N1', 'exam preparation'],
};

export default function StudyPlanLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
