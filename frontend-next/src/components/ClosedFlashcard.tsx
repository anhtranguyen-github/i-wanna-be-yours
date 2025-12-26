import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { getTagById } from '@/constants/tags';

interface ClosedFlashcardProps {
  title: string;
  subtitle?: string;
  tags: string[]; // Array of Tag IDs
  description: string;
  openModal: () => void;
  onMouseEnter?: () => void;
  buttonText?: string;
  detailLink?: string;
}

const ClosedFlashcard: React.FC<ClosedFlashcardProps> = ({
  title,
  subtitle = '',
  tags = [],
  description,
  openModal,
  onMouseEnter,
  buttonText = 'Start Session',
  detailLink,
}) => {
  // Separate tags into "Level/Skill" (for header) and "Metadata" (for body)
  const tagObjects = tags.map(id => getTagById(id)).filter(Boolean) as any[];
  const levelTag = tagObjects.find(t => t.type === 'level' || t.type === 'skill');
  const otherTags = tagObjects.filter(t => t !== levelTag);

  return (
    <div
      className="w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-800  rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover: hover:border-gray-300 dark:hover:border-gray-600 flex flex-col"
      onMouseEnter={onMouseEnter}
    >
      {/* Header: Icon, Title, Level */}
      <div className="flex items-start gap-4 p-6 pb-2">
        {/* Placeholder Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M11.25 4.533A9.707 9.707 0 006 3.75a9.709 9.709 0 01-3.75-3.75V15c0 1.666.72 3.196 1.863 4.285A9.755 9.755 0 016 18c1.88 0 3.636.529 5.12 1.442V4.533zM12.75 4.533V19.442A9.755 9.755 0 0118 18c1.143 0 1.863-1.531 1.863-1.863V0c-1.052 0-2.062.18-3 .512a9.707 9.707 0 00-6.75-3.75z" />
          </svg>
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <h3 className="text-lg font-bold text-neutral-ink dark:text-white leading-tight">
              {title}
            </h3>
            {/* Level Badge */}
            {levelTag && (
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide
                        ${levelTag.type === 'level' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                {levelTag.label}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm font-medium text-neutral-ink dark:text-neutral-ink">{subtitle}</p>}
        </div>
      </div>

      {/* Body: Description, Divider, Tags */}
      <div className="px-6 py-2 flex-grow">
        <p className="text-neutral-ink dark:text-neutral-ink text-sm mb-4 leading-relaxed line-clamp-3">
          {description}
        </p>

        <hr className="border-gray-100 dark:border-gray-700 mb-4" />

        {/* Metadata Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {otherTags.map(tag => (
            <span key={tag.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 dark:bg-gray-700/50 text-neutral-ink dark:text-neutral-ink border border-gray-100 dark:border-gray-700">
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 pt-0 mt-auto space-y-4">
        <button
          onClick={openModal}
          className="w-full py-3 px-4 bg-brand-salmon hover:bg-brand-salmon/90 text-white font-bold rounded-lg  transition-colors flex items-center justify-center gap-2"
        >
          {buttonText || 'Start Session'}
          <ChevronRightIcon className="w-5 h-5" />
        </button>

        <div className="flex justify-between items-center text-sm font-medium text-neutral-ink dark:text-neutral-ink px-1">
          {detailLink ? (
            <a href={detailLink} className="hover:text-brand-salmon transition-colors">
              View Details
            </a>
          ) : (
            <span className="opacity-50 cursor-not-allowed">View Details</span>
          )}

          <button className="hover:text-brand-salmon transition-colors">
            Edit Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClosedFlashcard;




















// ---------------------------------------------------------------------

// // ClosedFlashcard.tsx

// import React from 'react';
// import { ChevronRightIcon } from '@heroicons/react/20/solid';

// interface ClosedFlashcardProps {
//   p_tag: string;
//   s_tag?: string;
//   badgeText: string;
//   badgeColor?: string; // Tailwind CSS classes for badge background and text
//   description: string;
//   openModal: () => void;
//   buttonText?: string;
// }

// const ClosedFlashcard: React.FC<ClosedFlashcardProps> = ({
//   p_tag,
//   s_tag = '',
//   badgeText,
//   badgeColor = 'bg-blue-100 text-blue-800', // Default badge color
//   description,
//   openModal,
//   buttonText = 'Open Flashcard',
// }) => {
//   return (
//     <div className="col-span-1 rounded-lg bg-white dark:bg-gray-800  p-6 max-w-md">
//       {/* Content Section */}
//       <div className="flex flex-col space-y-4">
//         {/* Title and Badge */}
//         <div className="flex items-center space-x-3">
//           <h3 className="truncate text-base font-medium text-neutral-ink dark:text-neutral-ink">
//             {p_tag}
//           </h3>
//           <h4 className="truncate text-base font-sm text-neutral-ink dark:text-neutral-ink">
//             {s_tag}
//           </h4>
//           <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeColor}`}>
//             {badgeText}
//           </span>
//         </div>
//         {/* Description */}
//         <p className="text-sm text-neutral-ink dark:text-neutral-ink">
//           {description}
//         </p>
//         {/* Open Flashcard Button */}
//         <button
//           type="button"
//           onClick={openModal}
//           className="inline-flex items-center justify-center rounded-md border border-blue-600 text-blue-600 text-sm font-medium px-4 py-2 transition duration-150 bg-transparent hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
//         >
//           <ChevronRightIcon className="h-5 w-5 mr-2" aria-hidden="true" />
//           {buttonText}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ClosedFlashcard;
