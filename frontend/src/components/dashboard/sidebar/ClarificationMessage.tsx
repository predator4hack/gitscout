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
        <div className="rounded-xl rounded-tl-sm border border-white/5 bg-[#1E2024] p-4 space-y-3">
            <div className="text-sm font-medium text-zinc-300">
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
                                ? "border-gs-purple bg-gs-purple/20 text-gs-purple"
                                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
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
                                    ? "border-gs-purple bg-gs-purple/20 text-gs-purple"
                                    : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
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
                                className="w-full px-3 py-2 text-sm border border-white/10 bg-white/5 text-zinc-300 placeholder:text-zinc-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gs-purple focus:border-gs-purple disabled:opacity-50"
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
                className="w-full px-4 py-2 text-sm font-medium text-white bg-gs-purple rounded-md hover:bg-gs-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Submit
            </button>
        </div>
    );
}
