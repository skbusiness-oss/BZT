import { useParams, useNavigate } from 'react-router-dom';
import { ALL_PROGRAMS } from '../data/programData';
import { ProgramDetail } from '../components/workouts/ProgramDetail';
import { Loader2 } from 'lucide-react';

export const ProgramBrowse = () => {
    const { programId } = useParams<{ programId: string }>();
    const navigate = useNavigate();

    const program = ALL_PROGRAMS.find((p) => p.id === programId);

    if (!program) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-on-surface/50 font-body">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-[10px] font-label font-bold uppercase tracking-widest">Program not found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <ProgramDetail
                program={program}
                readOnly
                onBack={() => navigate('/workouts')}
            />
        </div>
    );
};
