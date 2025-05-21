import { UpdateItem } from "@/lib/updates"
import { Button } from "./ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"



export const UpdateDialog = ({ updates }: { updates: UpdateItem[]}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">更新履歴</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>更新履歴</DialogTitle>
          <DialogDescription>
            アップデート履歴は以下の通りです。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Accordion type="single" collapsible className="w-full">
            {updates.map((update, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>
                  <div className="flex justify-between w-full">
                    <span className="font-medium">ver {update.version}</span>
                    <span className="text-sm text-gray-500">{update.date}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside text-sm">
                    {update.description.map((desc, i) => (
                      <li key={i}>{desc}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <DialogFooter>
          <DialogClose>
            <Button variant="outline">閉じる</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}