import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

export function RemoveMessageDialogComponent({ isOpen, onClose, onConfirm }) {
  const [selectedOption, setSelectedOption] = useState("all");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-xl p-6 shadow-xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#004939f3] text-center">
            Who do you want to recall this message from?
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 text-[#004939f3] text-sm space-y-4">
          <RadioGroup
            value={selectedOption}
            onValueChange={setSelectedOption}
            className="space-y-4"
          >
            {/* Option 1 */}
            <div className="flex items-start gap-3">
              <RadioGroupItem
                value="all"
                id="recall-all"
                className="mt-1 border-green-200 bg-[#01aa851d] text-[#004939f3] focus:ring-[#01aa85]"
              />
              <Label htmlFor="recall-all" className="cursor-pointer w-full">
                <div className="flex flex-col">
                  <span className="font-semibold text-lg text-[#004939f3]">
                    Recall for Everyone
                  </span>
                  <span className="mt-1 text-base text-[#004939a0] leading-relaxed">
                    This message will be recalled for everyone in the chat.
                    Others may have seen or forwarded it. Recall messages can
                    still be reported.
                  </span>
                </div>
              </Label>
            </div>

            {/* Option 2 */}
            <div className="flex items-start gap-3">
              <RadioGroupItem
                value="you"
                id="recall-you"
                className="mt-1 border-green-200 bg-[#01aa851d] text-[#004939f3] focus:ring-[#01aa85]"
              />
              <Label htmlFor="recall-you" className="cursor-pointer w-full">
                <div className="flex flex-col">
                  <span className=" text-lg font-semibold text-[#004939f3]">
                    Recall for You
                  </span>
                  <span className="mt-1 text-base text-md text-[#004939a0] leading-relaxed">
                    This message will be removed from your device, but will
                    remain visible to other members of the chat.
                  </span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="border-t pt-4 mt-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="bg-white border border-[#01aa85] text-[#01aa85] font-medium px-4 py-2 rounded-md hover:bg-[#01aa8510] transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedOption)}
            className="bg-[#01aa85] text-white font-bold px-4 py-2 rounded-md hover:bg-[#01aa85d1] transition"
          >
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
