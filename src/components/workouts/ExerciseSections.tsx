import { Exercise } from '../../types';
import { ExerciseCard } from './ExerciseCard';

type ExerciseSectionsProps = {
    exercises: Exercise[];
    onExerciseClick?: (exercise: Exercise) => void;
};

const buildSections = (exercises: Exercise[]) => {
    const indexed = exercises.map((exercise, index) => ({ exercise, index }));
    if (indexed.length <= 4) {
        return [{ title: 'Routine', meta: `${indexed.length} moves`, items: indexed }];
    }

    const startCount = indexed.length >= 8 ? 2 : 1;
    const finishCount = indexed.length >= 7 ? 2 : 1;
    const start = indexed.slice(0, startCount);
    const finish = indexed.slice(indexed.length - finishCount);
    const main = indexed.slice(startCount, indexed.length - finishCount);

    return [
        { title: 'Start Here', meta: `${start.length} primer${start.length === 1 ? '' : 's'}`, items: start },
        { title: 'Main Work', meta: `${main.length} exercises`, items: main },
        { title: 'Finish', meta: `${finish.length} move${finish.length === 1 ? '' : 's'}`, items: finish },
    ].filter(section => section.items.length > 0);
};

export const ExerciseSections = ({ exercises, onExerciseClick }: ExerciseSectionsProps) => {
    const sections = buildSections(exercises);

    return (
        <div className="space-y-6">
            {sections.map(section => (
                <section key={section.title} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h4 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/55">
                            {section.title}
                        </h4>
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest text-primary/80">
                            {section.meta}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {section.items.map(({ exercise, index }) => (
                            <ExerciseCard
                                key={`${exercise.name}-${index}`}
                                exercise={exercise}
                                index={index}
                                onClick={onExerciseClick ? () => onExerciseClick(exercise) : undefined}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};
