import { DayEntry } from '../../types';

interface DailyTrackingTableProps {
    entries: DayEntry[];
    readOnly?: boolean;
    onChange: (index: number, field: keyof DayEntry, value: number) => void;
}

export const DailyTrackingTable = ({ entries, readOnly = false, onChange }: DailyTrackingTableProps) => {
    return (
        <div className="overflow-x-auto rounded-xl clay-inset">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-on-surface/70 uppercase" style={{ background: 'rgba(8,11,42,0.6)' }}>
                    <tr>
                        <th className="px-4 py-3">Day</th>
                        <th className="px-4 py-3">Weight</th>
                        <th className="px-4 py-3">Carbs</th>
                        <th className="px-4 py-3">Protein</th>
                        <th className="px-4 py-3">Fats</th>
                        <th className="px-4 py-3">Cardio</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                    {entries.map((entry, index) => (
                        <tr key={index} className="hover:bg-surface-container/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-on-surface">
                                {index + 1}
                            </td>
                            <td className="px-4 py-2">
                                <input
                                    type="number"
                                    disabled={readOnly}
                                    value={entry.weight || ''}
                                    onChange={(e) => onChange(index, 'weight', parseFloat(e.target.value))}
                                    placeholder="0.0"
                                    className="w-16 clay-input px-2 py-1 text-sm disabled:opacity-50"
                                />
                            </td>
                            <td className="px-4 py-2">
                                <input
                                    type="number"
                                    disabled={readOnly}
                                    value={entry.carbs || ''}
                                    onChange={(e) => onChange(index, 'carbs', parseFloat(e.target.value))}
                                    className="w-16 clay-input px-2 py-1 text-sm disabled:opacity-50"
                                />
                            </td>
                            <td className="px-4 py-2">
                                <input
                                    type="number"
                                    disabled={readOnly}
                                    value={entry.protein || ''}
                                    onChange={(e) => onChange(index, 'protein', parseFloat(e.target.value))}
                                    className="w-16 clay-input px-2 py-1 text-sm disabled:opacity-50"
                                />
                            </td>
                            <td className="px-4 py-2">
                                <input
                                    type="number"
                                    disabled={readOnly}
                                    value={entry.fats || ''}
                                    onChange={(e) => onChange(index, 'fats', parseFloat(e.target.value))}
                                    className="w-16 clay-input px-2 py-1 text-sm disabled:opacity-50"
                                />
                            </td>
                            <td className="px-4 py-2">
                                <input
                                    type="number"
                                    disabled={readOnly}
                                    value={entry.cardio || ''}
                                    onChange={(e) => onChange(index, 'cardio', parseFloat(e.target.value))}
                                    placeholder="0"
                                    className="w-16 clay-input px-2 py-1 text-sm disabled:opacity-50"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
