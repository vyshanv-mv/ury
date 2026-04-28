import { CheckCircle2, LayoutDashboard, Sparkles, ArrowRight } from "lucide-react";
import type { OnboardingStepProps } from "../../../data/steps-data";
import { Button } from "../../ui/button";

export function SuccessStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-inter">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center">
          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg mb-6 shadow-lg shadow-blue-200"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-gray-900 text-3xl font-medium">
                Setup Complete
              </h1>
            </div>
            <p className="text-gray-500 mb-2 text-sm">
              Your <span className="font-semibold text-primary-600">URY</span> restaurant system is ready to use.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-3 my-7">
            {[
              { icon: <Sparkles className="w-4 h-4" />, label: "System Ready" },
              { icon: <LayoutDashboard className="w-4 h-4" />, label: "POS Active" },
              { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard Live" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-primary-50 rounded-lg p-3 flex flex-col items-center gap-1.5"
              >
                <div className="text-primary-600">{item.icon}</div>
                <span className="text-primary-700 text-xs font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div>
            <Button
              onClick={() => onNext()}
              size="lg"
              className="rounded-md w-full gap-2 font-medium bg-blue-600 shadow-lg shadow-blue-100"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-gray-500 mt-5 text-sm">
            You can configure more settings anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
