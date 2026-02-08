import React, { useState, useEffect } from "react";
import { MultiClarificationContent } from "../../../types/dashboard";

interface MultiClarificationMessageProps {
    content: MultiClarificationContent;
    messageId: string;
    onAnswer: (messageId: string, answers: Record<string, string>) => void;
    disabled?: boolean;
}

export const MultiClarificationMessage: React.FC<
    MultiClarificationMessageProps
> = ({ content, messageId, onAnswer, disabled = false }) => {
    // Track answers by field_name
    const [answers, setAnswers] = useState<Record<string, string>>({});
    // Track which questions should show custom input
    const [showCustomInput, setShowCustomInput] = useState<
        Record<string, boolean>
    >({});
    // Track custom input values
    const [customInputs, setCustomInputs] = useState<Record<string, string>>(
        {}
    );

    // Check if all questions are answered
    const allAnswered = content.questions.every(
        (q) => answers[q.field_name] && answers[q.field_name].trim() !== ""
    );

    const handleOptionSelect = (fieldName: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [fieldName]: value }));
        // Hide custom input if selecting a predefined option
        setShowCustomInput((prev) => ({ ...prev, [fieldName]: false }));
    };

    const handleOtherSelect = (fieldName: string) => {
        setShowCustomInput((prev) => ({ ...prev, [fieldName]: true }));
        // Clear the answer until they type something
        setAnswers((prev) => {
            const newAnswers = { ...prev };
            delete newAnswers[fieldName];
            return newAnswers;
        });
    };

    const handleCustomInputChange = (fieldName: string, value: string) => {
        setCustomInputs((prev) => ({ ...prev, [fieldName]: value }));
        if (value.trim()) {
            setAnswers((prev) => ({ ...prev, [fieldName]: value.trim() }));
        } else {
            setAnswers((prev) => {
                const newAnswers = { ...prev };
                delete newAnswers[fieldName];
                return newAnswers;
            });
        }
    };

    const handleSubmit = () => {
        if (allAnswered && !disabled) {
            onAnswer(messageId, answers);
        }
    };

    return (
        <div className="bg-[#1E2024] border border-white/5 rounded-xl rounded-tl-sm p-4 space-y-4">
            <div className="text-xs text-zinc-400 font-medium mb-3">
                Please answer the following questions to refine your search:
            </div>

            {content.questions.map((question, index) => (
                <div key={question.field_name} className="space-y-2">
                    {/* Question number and text */}
                    <div className="text-sm text-zinc-300 font-medium">
                        <span className="text-gs-purple mr-2">
                            {index + 1}.
                        </span>
                        {question.question}
                    </div>

                    {/* Options */}
                    <div className="flex flex-wrap gap-2">
                        {question.options.map((option) => {
                            const isSelected =
                                answers[question.field_name] === option.value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() =>
                                        handleOptionSelect(
                                            question.field_name,
                                            option.value
                                        )
                                    }
                                    disabled={disabled}
                                    className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                                        isSelected
                                            ? "bg-gs-purple/20 border-gs-purple text-gs-purple font-medium"
                                            : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                                    } ${
                                        disabled
                                            ? "opacity-50 cursor-not-allowed"
                                            : "cursor-pointer"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}

                        {/* Other (specify) button */}
                        {question.allow_custom && (
                            <button
                                onClick={() =>
                                    handleOtherSelect(question.field_name)
                                }
                                disabled={disabled}
                                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                                    showCustomInput[question.field_name]
                                        ? "bg-gs-purple/20 border-gs-purple text-gs-purple font-medium"
                                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                                } ${
                                    disabled
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer"
                                }`}
                            >
                                Other (specify)
                            </button>
                        )}
                    </div>

                    {/* Custom input field */}
                    {showCustomInput[question.field_name] && (
                        <input
                            type="text"
                            value={customInputs[question.field_name] || ""}
                            onChange={(e) =>
                                handleCustomInputChange(
                                    question.field_name,
                                    e.target.value
                                )
                            }
                            placeholder="Please specify..."
                            disabled={disabled}
                            className="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-gs-purple focus:ring-1 focus:ring-gs-purple disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    )}
                </div>
            ))}

            {/* Submit button */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSubmit}
                    disabled={!allAnswered || disabled}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                        allAnswered && !disabled
                            ? "bg-gs-purple text-white hover:bg-gs-purple/90 cursor-pointer"
                            : "bg-gs-purple/30 text-white/50 cursor-not-allowed"
                    }`}
                >
                    {disabled ? "Processing..." : "Continue"}
                </button>
            </div>
        </div>
    );
};
