import React from "react";
import { useTheme } from "../../hooks/useTheme";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
    const { darkMode } = useTheme();

    return (
        <div
            className={`animate-pulse rounded-md ${className}`}
            style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.5)" : "rgba(229, 231, 235, 1)", // gray-700/50 : gray-200
            }}
            {...props}
        />
    );
};

export default Skeleton;
