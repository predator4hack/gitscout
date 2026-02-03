import { useState } from "react";
import { ClarificationQuestion } from "../../../types/dashboard";

interface ClarificationMessageProps {
    clarification: ClarificationQuestion;
    onAnswer: (answer: string) => void;
    disabled?: boolean;
}

export function ClarificationMessage({
    clarification,
    onAnswer,
    disabled = false,
}: ClarificationMessageProps) {
    const [selectedValue, setSelectedValue] = useState<string>("");
    const [customValue, setCustomValue] = useState<string>("");
    const [showCustomInput, setShowCustomInput] = useState(false);

    const handleSubmit = () => {
        const answer = showCustomInput ? customValue : selectedValue;
        if (answer) {
            onAnswer(answer);
        }
    };

    const handleOptionSelect = (value: string) => {
        setSelectedValue(value);
        setShowCustomInput(false);
        setCustomValue("");
    };

    const handleCustomClick = () => {
        setShowCustomInput(true);
        setSelectedValue("");
    };

    return (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-3">
            <div className="text-sm font-medium text-gray-800">
                {clarification.question}
            </div>

            <div className="space-y-2">
                {/* Predefined options */}
                {clarification.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleOptionSelect(option.value)}
                        disabled={disabled}
                        className={`w-full px-4 py-2 text-sm text-left rounded-md border transition-colors ${
                            selectedValue === option.value
                                ? "border-purple-500 bg-purple-100 text-purple-900"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {option.label}
                    </button>
                ))}

                {/* Custom input option */}
                {clarification.allow_custom && (
                    <>
                        <button
                            onClick={handleCustomClick}
                            disabled={disabled}
                            className={`w-full px-4 py-2 text-sm text-left rounded-md border transition-colors ${
                                showCustomInput
                                    ? "border-purple-500 bg-purple-100 text-purple-900"
                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Custom value
                        </button>

                        {showCustomInput && (
                            <input
                                type="text"
                                value={customValue}
                                onChange={(e) => setCustomValue(e.target.value)}
                                placeholder="Enter custom value..."
                                disabled={disabled}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                                autoFocus
                            />
                        )}
                    </>
                )}
            </div>

            {/* Submit button */}
            <button
                onClick={handleSubmit}
                disabled={
                    disabled ||
                    (!selectedValue && !customValue) ||
                    (showCustomInput && !customValue.trim())
                }
                className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Submit
            </button>
        </div>
    );
}
