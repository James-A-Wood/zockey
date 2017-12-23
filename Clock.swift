

import Foundation
import UIKit
import AVFoundation


class Clock: SoundPlayerDelegate {
    
    
    enum Mode: Int {
        case stopwatch = 1
        case timer = -1
    }
    
    
    var view: UIViewController?
    var mode: Mode = .stopwatch
    var timeInterval: TimeInterval = 0.01

    var countdownFrom = 20.0
    var currentTime = 20.0
    var storedTime: Double = 0.0
    
    var isRunning = false
    var autoStartTimer = false
    var soundPlayer: SoundPlayer?
    var lastTickTime: Date?
    var timer: Timer?
    var startButton: UIButton?
    var resetButton: UIButton?
    var display: Display?
    var defaults: UserDefaults?
    var selectModeSegmentedControl: UISegmentedControl?
    var incrementButtonsStackView: UIStackView?
    

    init(view: UIViewController, incrementButtonsStackView: UIStackView? = nil, selectModeSegmentedControl: UISegmentedControl? = nil) {
        
        
        self.view = view
        self.defaults = UserDefaults.standard
        self.selectModeSegmentedControl = selectModeSegmentedControl
        self.incrementButtonsStackView = incrementButtonsStackView
        
        
        if soundPlayer != nil {
            soundPlayer?.delegate = self
        }
        
        
        if autoStartTimer {
            start()
        }
    }
    
    
    func setMode(selectedIndex: Int) {
        if selectedIndex == 0 {
            mode = .timer
            defaults?.set("timer", forKey: "mode")
        } else {
            mode = .stopwatch
            defaults?.set("stopwatch", forKey: "mode")
        }
        reset()
    }
    
    
    func startButtonHandler() {
        isRunning = !isRunning
        isRunning ? start() : stop()
    }
    

    func start() {
        
        
        // resetting if we're in timer mode, and the current time is 0
        if mode == .timer && currentTime <= 0 {
            reset()
            return
        }
        
        
        soundPlayer?.stop()
        soundPlayer?.play("stack")
        
        
        startButton?.setTitle("Stop", for: .normal)
        startButton?.backgroundColor = UIColor.orange
        lastTickTime = nil
        timer = Timer.scheduledTimer(timeInterval: timeInterval, target: self, selector: #selector(onTick), userInfo: nil, repeats: true)
    }
    
    
    func stop() {
        soundPlayer?.stop()
        startButton?.setTitle("Start", for: .normal)
        startButton?.backgroundColor = UIColor.init(red: 0, green: 0.6, blue: 0, alpha: 1)
        timer?.invalidate()
        isRunning = false
    }
    
    
    @objc func onTick() {
        if lastTickTime != nil {
            currentTime += Date().timeIntervalSince(lastTickTime!) * Double(mode.rawValue)
        }
        lastTickTime = Date()
        display?.update(self, time: currentTime)
        if mode == .timer && currentTime <= 0 {
            currentTime = 0.0
            timerHasFinished()
        }
    }
    
    
    func timerHasFinished() {
        stop()
        soundPlayer?.play("alarm", doesRepeat: true)
        display?.onFinish()
    }
    
    
    func clear() {
        currentTime = 0.0
        defaults?.set(currentTime, forKey: "countdownFrom")
        reset()
    }
    

    func incrementCurrentTime(by amount: Double) {
        if mode == .stopwatch {
            return
        }
        stop()
        currentTime += amount
        currentTime = floor(currentTime)
        currentTime = currentTime < 0 ? 0 : currentTime
        storedTime = floor(currentTime)
        resetButton?.setTitle("Set: \(storedTime)s", for: .normal)
        if currentTime > 0 {
            soundPlayer?.play("stack")
        }
        display?.update(self, time: currentTime)
        defaults?.set(currentTime, forKey: "countdownFrom")
    }
    
    
    func reset(toLastSetting: Bool = false) {
        
        
        stop()
        
        
        // grabbing mode from the cache and setting the "mode" stored property
        if let cachedMode = defaults?.string(forKey: "mode") {
            mode = (cachedMode == "stopwatch") ? .stopwatch : .timer
        }
        
        
        // setting currentTime & countdownFrom
        if mode == .stopwatch {
            currentTime = 0.0
            incrementButtonsStackView?.isHidden = true
            resetButton?.isHidden = true
            selectModeSegmentedControl?.selectedSegmentIndex = 1
        } else {
            
            
            // ... if we're in Timer mode
            incrementButtonsStackView?.isHidden = false
            resetButton?.isHidden = false
            selectModeSegmentedControl?.selectedSegmentIndex = 0
            
            
            if toLastSetting == true {
                countdownFrom = storedTime
                currentTime = storedTime
                print("Here, it's \(currentTime)")
            } else {
                if let cachedSeconds = defaults?.double(forKey: "countdownFrom") {
                    if cachedSeconds != 0.0 {
                        countdownFrom = cachedSeconds
                        currentTime = cachedSeconds
                    }
                }
            }
        }
        
        
        lastTickTime = nil
        display?.update(self, time: currentTime)
    }
    
    
    func setStopwatchMode() {
        currentTime = 0
        display?.update(self, time: currentTime)
    }
    
    
    func didFinishPlaying() {
        //
    }
}






//        COOL SYNTAX!  This is how to make alerts!
//        let alertController = UIAlertController(title: "This is the title", message: "This is the message itself", preferredStyle: .alert)
//        let action = UIAlertAction(title: "Got it", style: .default, handler: nil)
//        alertController.addAction(action)
//
//        // need to call this from the ViewController
//        view?.present(alertController, animated: true, completion: nil)























