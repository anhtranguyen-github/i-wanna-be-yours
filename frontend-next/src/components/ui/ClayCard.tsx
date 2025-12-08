import React from 'react';

interface ClayCardProps {
    title?: string;
    children: React.ReactNode;
    className?: string; // Allow custom classes for flexibility
    style?: React.CSSProperties;
}

const ClayCard: React.FC<ClayCardProps> = ({ title, children, className = '', style = {} }) => {
    return (
        <div
            className={`
                rounded-3xl 
                p-6 
                transition-all 
                duration-300 
                ${className}
            `}
            style={{
                backgroundColor: 'hsl(var(--surface-card))',
                boxShadow: 'var(--shadow-elevation-medium)',
                color: 'hsl(var(--text-default))',
                ...style
            }}
        >
            {title && (
                <h3
                    className="text-xl font-bold mb-4"
                    style={{ color: 'hsl(var(--primary))' }}
                >
                    {title}
                </h3>
            )}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default ClayCard;
